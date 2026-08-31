-- Migration: NimbusPost pincode-serviceability integration
-- Run this in the Supabase SQL Editor (same manual-run pattern as
-- migration_security_fixes.sql — nothing here is auto-applied).
--
-- Adds:
--   1. orders.shipping_fee — the flat shipping/COD fee actually charged
--      (previously always 0; place_order() hardcoded it).
--   2. place_order(..., p_shipping_fee) — extended, backward-compatible
--      (new param is trailing + defaulted, so every existing call site
--      keeps working unchanged) to accept that fee. Only ever called by
--      the server (never the browser) — see /api/orders/place.
--
-- NimbusPost itself is used only to check whether a pincode is
-- deliverable (and COD-eligible) before checkout proceeds — see
-- src/lib/nimbuspost.ts. Shipments are booked manually on NimbusPost's
-- own dashboard, not through this app, so there's no shipment/tracking
-- schema here.

-- ============================================================
-- 1. orders.shipping_fee
-- ============================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) DEFAULT 0;

-- ============================================================
-- 2. place_order() — add p_shipping_fee (trailing, defaulted)
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_order(
  p_items           JSONB,         -- [{product_id, size, quantity}]
  p_shipping_name   TEXT,
  p_shipping_email  TEXT,
  p_shipping_phone  TEXT,
  p_shipping_address TEXT,
  p_shipping_city   TEXT,
  p_shipping_state  TEXT,
  p_shipping_pincode TEXT,
  p_coupon_code     TEXT DEFAULT NULL,
  p_payment_method  TEXT DEFAULT 'cod',   -- 'cod' | 'razorpay'
  p_razorpay_payment_id TEXT DEFAULT NULL,
  p_razorpay_order_id   TEXT DEFAULT NULL,
  p_razorpay_signature  TEXT DEFAULT NULL,
  p_shipping_fee    DECIMAL(10,2) DEFAULT 0  -- flat shipping/COD fee, set server-side only
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         UUID;
  v_order_id        UUID;
  v_item            JSONB;
  v_product         RECORD;
  v_inv_qty         INT;
  v_req_qty         INT;
  v_unit_price      DECIMAL(10,2);
  v_subtotal        DECIMAL(10,2) := 0;
  v_discount_amt    DECIMAL(10,2) := 0;
  v_shipping_fee    DECIMAL(10,2) := 0;
  v_total           DECIMAL(10,2);
  v_coupon          RECORD;
  v_coupon_id       UUID;
  v_payment_status  TEXT;
BEGIN
  -- ---- 1. Require authentication ----
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to place an order.'
      USING ERRCODE = '42501';
  END IF;

  -- ---- 2. Validate items array ----
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.'
      USING ERRCODE = '22023';
  END IF;

  -- ---- 3. Validate shipping fields ----
  IF p_shipping_name IS NULL OR trim(p_shipping_name) = ''
    OR p_shipping_email IS NULL OR trim(p_shipping_email) = ''
    OR p_shipping_phone IS NULL OR trim(p_shipping_phone) = ''
    OR p_shipping_address IS NULL OR trim(p_shipping_address) = ''
    OR p_shipping_city IS NULL OR trim(p_shipping_city) = ''
    OR p_shipping_state IS NULL OR trim(p_shipping_state) = ''
    OR p_shipping_pincode IS NULL OR trim(p_shipping_pincode) = ''
  THEN
    RAISE EXCEPTION 'All shipping fields are required.'
      USING ERRCODE = '22023';
  END IF;

  -- ---- 4. Calculate server-side prices and validate stock ----
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_req_qty := (v_item->>'quantity')::INT;

    IF v_req_qty IS NULL OR v_req_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', (v_item->>'product_id')
        USING ERRCODE = '22023';
    END IF;

    IF v_req_qty > 100 THEN
      RAISE EXCEPTION 'Quantity % exceeds maximum allowed per item (100).', v_req_qty
        USING ERRCODE = '22023';
    END IF;

    -- Fetch authoritative product price from DB
    SELECT id, name, price, discount_price, is_hidden
    INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID
      AND is_hidden = false;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found or is unavailable.', (v_item->>'product_id')
        USING ERRCODE = '22023';
    END IF;

    -- Use server-authoritative price (discount_price if set, else price)
    v_unit_price := COALESCE(v_product.discount_price, v_product.price);

    -- Check inventory
    SELECT quantity INTO v_inv_qty
    FROM public.inventory
    WHERE product_id = v_product.id
      AND size = (v_item->>'size');

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % size % is not available.', v_product.name, (v_item->>'size')
        USING ERRCODE = '22023';
    END IF;

    IF v_inv_qty < v_req_qty THEN
      RAISE EXCEPTION 'Insufficient stock for % size %. Available: %, Requested: %',
        v_product.name, (v_item->>'size'), v_inv_qty, v_req_qty
        USING ERRCODE = '22023';
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_req_qty);
  END LOOP;

  -- ---- 5. Validate and apply coupon (server-side) ----
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT id, discount_percent, discount_amount, expiry_date, usage_limit, times_used, min_order_value
    INTO v_coupon
    FROM public.coupons
    WHERE code = upper(trim(p_coupon_code))
      AND expiry_date > now()
      AND (usage_limit IS NULL OR times_used < usage_limit);

    IF FOUND THEN
      v_coupon_id := v_coupon.id;

      IF v_subtotal >= COALESCE(v_coupon.min_order_value, 0) THEN
        IF v_coupon.discount_percent IS NOT NULL THEN
          v_discount_amt := ROUND(v_subtotal * v_coupon.discount_percent / 100.0, 2);
        ELSIF v_coupon.discount_amount IS NOT NULL THEN
          v_discount_amt := LEAST(v_coupon.discount_amount, v_subtotal);
        END IF;
      END IF;
    END IF;
    -- Invalid coupon silently yields 0 discount (graceful degradation)
  END IF;

  -- ---- 6. Shipping fee — server-supplied only (see param doc above) ----
  v_shipping_fee := GREATEST(COALESCE(p_shipping_fee, 0), 0);

  -- ---- 7. Final total ----
  v_total := v_subtotal - v_discount_amt + v_shipping_fee;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- ---- 8. Create order ----
  INSERT INTO public.orders (
    user_id,
    status,
    total_amount,
    shipping_fee,
    coupon_id,
    shipping_name,
    shipping_email,
    shipping_phone,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_pincode
  ) VALUES (
    v_user_id,
    'pending',
    v_total,
    v_shipping_fee,
    v_coupon_id,
    trim(p_shipping_name),
    trim(p_shipping_email),
    trim(p_shipping_phone),
    trim(p_shipping_address),
    trim(p_shipping_city),
    trim(p_shipping_state),
    trim(p_shipping_pincode)
  )
  RETURNING id INTO v_order_id;

  -- ---- 9. Create order_items + decrement inventory atomically ----
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_req_qty := (v_item->>'quantity')::INT;

    -- Re-fetch price for each item
    SELECT COALESCE(discount_price, price) INTO v_unit_price
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      size,
      quantity,
      price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'size',
      v_req_qty,
      v_unit_price
    );

    -- Atomic inventory decrement with negative stock guard
    UPDATE public.inventory
    SET quantity   = quantity - v_req_qty,
        updated_at = now()
    WHERE product_id = (v_item->>'product_id')::UUID
      AND size      = (v_item->>'size')
      AND quantity  >= v_req_qty;  -- Prevents negative stock

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock changed during checkout for product %. Please try again.', (v_item->>'product_id')
        USING ERRCODE = '40001';
    END IF;
  END LOOP;

  -- ---- 10. Create payment record ----
  IF p_payment_method = 'razorpay' THEN
    v_payment_status := 'success';
  ELSE
    v_payment_status := 'pending';  -- COD: payment on delivery
  END IF;

  INSERT INTO public.payments (
    order_id,
    provider,
    transaction_id,
    signature,
    amount,
    status
  ) VALUES (
    v_order_id,
    p_payment_method,
    COALESCE(p_razorpay_payment_id, 'cod_' || v_order_id::TEXT),
    p_razorpay_signature,
    v_total,
    v_payment_status
  );

  -- ---- 11. Increment coupon usage ----
  IF v_coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET times_used = times_used + 1
    WHERE id = v_coupon_id;
  END IF;

  -- ---- 12. Return success ----
  RETURN jsonb_build_object(
    'success',   true,
    'order_id',  v_order_id,
    'total',     v_total,
    'subtotal',  v_subtotal,
    'discount',  v_discount_amt,
    'shipping',  v_shipping_fee
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Any failure rolls back the entire transaction automatically
    RAISE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL) TO authenticated;
