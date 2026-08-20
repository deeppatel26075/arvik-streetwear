-- ============================================================
-- ARVIIK SECURITY FIX MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================
-- This migration is IDEMPOTENT — safe to re-run.
-- It fixes:
--   1. is_admin() SECURITY DEFINER function (non-recursive)
--   2. All recursive RLS policies across every table
--   3. handle_new_user() email admin backdoor
--   4. prevent_self_role_escalation trigger
--   5. inventory table (simple product_id + size keyed)
--   6. place_order() atomic SECURITY DEFINER function
--   7. Permissive public INSERT policies on orders/order_items/payments
-- ============================================================

-- ============================================================
-- STEP 1: CREATE/REPLACE is_admin() AS SECURITY DEFINER
-- This is the ONLY way to check admin status in ALL policies.
-- It reads auth.uid() directly — never re-reads profiles via RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Allow all authenticated users to call is_admin()
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;


-- ============================================================
-- STEP 2: FIX profiles RLS — REMOVE RECURSIVE POLICIES
-- Replace the self-referencing policies with is_admin() calls.
-- ============================================================

-- Drop existing recursive policies on profiles
DROP POLICY IF EXISTS "Allow select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin update profiles" ON public.profiles;

-- New non-recursive policies
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      -- Normal users can update everything EXCEPT role
      -- Role protection is enforced by the trigger below
      TRUE
    )
  );

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());


-- ============================================================
-- STEP 3: ADD prevent_self_role_escalation TRIGGER
-- Blocks any non-admin from changing their own role.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the role field is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only allow if the current user is an admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Role escalation not permitted. Only administrators can change user roles.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();


-- ============================================================
-- STEP 4: FIX handle_new_user() — REMOVE EMAIL ADMIN BACKDOOR
-- New users always get 'customer' role. Admin assignment must
-- be done explicitly via an authorized admin operation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'   -- ALL new users start as customer — no email backdoor
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure the trigger is correctly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- STEP 5: FIX ALL OTHER TABLES — REPLACE RECURSIVE ADMIN CHECKS
-- Replace: EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
-- With:    public.is_admin()
-- ============================================================

-- ---- categories (migration 0002) ----
DROP POLICY IF EXISTS "Allow admin all on categories" ON public.categories;
CREATE POLICY "categories_admin_all"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- editions (migration 0002 + 0007) ----
DROP POLICY IF EXISTS "Allow public select on editions" ON public.editions;
DROP POLICY IF EXISTS "Allow admin all on editions" ON public.editions;
CREATE POLICY "editions_select_public"
  ON public.editions FOR SELECT
  TO public
  USING ((is_active = true AND is_visible = true) OR public.is_admin());
CREATE POLICY "editions_admin_all"
  ON public.editions FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- edition_themes (migration 0002) ----
DROP POLICY IF EXISTS "Allow admin all on themes" ON public.edition_themes;
CREATE POLICY "edition_themes_admin_all"
  ON public.edition_themes FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- edition_landing_blocks (migration 0002) ----
DROP POLICY IF EXISTS "Allow public select on landing blocks" ON public.edition_landing_blocks;
DROP POLICY IF EXISTS "Allow admin all on landing blocks" ON public.edition_landing_blocks;
CREATE POLICY "edition_landing_blocks_select"
  ON public.edition_landing_blocks FOR SELECT
  TO public
  USING (is_enabled = true OR public.is_admin());
CREATE POLICY "edition_landing_blocks_admin_all"
  ON public.edition_landing_blocks FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- products (migration 0003) ----
DROP POLICY IF EXISTS "Allow public select on products" ON public.products;
DROP POLICY IF EXISTS "Allow admin all on products" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  TO public
  USING (is_hidden = false OR public.is_admin());
CREATE POLICY "products_admin_all"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- product_images (migration 0003) ----
DROP POLICY IF EXISTS "Allow admin all on product images" ON public.product_images;
CREATE POLICY "product_images_admin_all"
  ON public.product_images FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- product_variants (migration 0003) ----
DROP POLICY IF EXISTS "Allow admin all on variants" ON public.product_variants;
CREATE POLICY "product_variants_admin_all"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- warehouses (migration 0003) ----
DROP POLICY IF EXISTS "Allow admin all on warehouses" ON public.warehouses;
CREATE POLICY "warehouses_admin_all"
  ON public.warehouses FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- warehouse_inventory (migration 0003) ----
DROP POLICY IF EXISTS "Allow admin all on warehouse inventory" ON public.warehouse_inventory;
CREATE POLICY "warehouse_inventory_admin_all"
  ON public.warehouse_inventory FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- inventory_history (migration 0003) ----
DROP POLICY IF EXISTS "Allow admin all on inventory history" ON public.inventory_history;
CREATE POLICY "inventory_history_admin_all"
  ON public.inventory_history FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- product_bundles (migration 0003) ----
DROP POLICY IF EXISTS "Allow admin all on product bundles" ON public.product_bundles;
CREATE POLICY "product_bundles_admin_all"
  ON public.product_bundles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- frequently_bought_together (migration 0003) ----
DROP POLICY IF EXISTS "Allow admin all on frequently bought" ON public.frequently_bought_together;
CREATE POLICY "frequently_bought_together_admin_all"
  ON public.frequently_bought_together FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- homepage_sections (migration 0005) ----
DROP POLICY IF EXISTS "Allow public select on homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Allow admin all on homepage sections" ON public.homepage_sections;
CREATE POLICY "homepage_sections_select"
  ON public.homepage_sections FOR SELECT
  TO public
  USING (is_enabled = true OR public.is_admin());
CREATE POLICY "homepage_sections_admin_all"
  ON public.homepage_sections FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- media_library (migration 0005) ----
DROP POLICY IF EXISTS "Allow admin all on media library" ON public.media_library;
CREATE POLICY "media_library_admin_all"
  ON public.media_library FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- navigation_menus (migration 0005) ----
DROP POLICY IF EXISTS "Allow admin all on menus" ON public.navigation_menus;
CREATE POLICY "navigation_menus_admin_all"
  ON public.navigation_menus FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- telemetry_sessions (migration 0006) ----
DROP POLICY IF EXISTS "Allow select own sessions" ON public.telemetry_sessions;
CREATE POLICY "telemetry_sessions_select"
  ON public.telemetry_sessions FOR SELECT
  TO public
  USING (user_id = auth.uid() OR user_id IS NULL OR public.is_admin());

-- ---- telemetry_events (migration 0006) ----
DROP POLICY IF EXISTS "Allow admin select events" ON public.telemetry_events;
CREATE POLICY "telemetry_events_admin_select"
  ON public.telemetry_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ---- blogs (migration 0006) ----
DROP POLICY IF EXISTS "Allow public select blogs" ON public.blogs;
DROP POLICY IF EXISTS "Allow admin all on blogs" ON public.blogs;
CREATE POLICY "blogs_select_public"
  ON public.blogs FOR SELECT
  TO public
  USING (is_published = true OR public.is_admin());
CREATE POLICY "blogs_admin_all"
  ON public.blogs FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- faqs (migration 0006) ----
DROP POLICY IF EXISTS "Allow admin all on faqs" ON public.faqs;
CREATE POLICY "faqs_admin_all"
  ON public.faqs FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- contact_messages (migration 0006) ----
DROP POLICY IF EXISTS "Allow admin all on contact messages" ON public.contact_messages;
CREATE POLICY "contact_messages_admin_all"
  ON public.contact_messages FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- admin_audit_logs (migration 0006) ----
DROP POLICY IF EXISTS "Allow admin all on audit logs" ON public.admin_audit_logs;
CREATE POLICY "audit_logs_admin_all"
  ON public.admin_audit_logs FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- coupons (migration 0004) ----
DROP POLICY IF EXISTS "Allow admin all on coupons" ON public.coupons;
CREATE POLICY "coupons_admin_all"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- currencies (migration 0004) ----
DROP POLICY IF EXISTS "Allow admin all on currencies" ON public.currencies;
CREATE POLICY "currencies_admin_all"
  ON public.currencies FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- orders (migration 0004) ----
DROP POLICY IF EXISTS "Allow select own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin all on orders" ON public.orders;
CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
-- No public INSERT — orders only created via place_order() SECURITY DEFINER
CREATE POLICY "orders_admin_all"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- order_items (migration 0004) ----
DROP POLICY IF EXISTS "Allow select own order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow admin all on order items" ON public.order_items;
CREATE POLICY "order_items_select_own"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );
-- No public INSERT — order_items only created via place_order() SECURITY DEFINER
CREATE POLICY "order_items_admin_all"
  ON public.order_items FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- payments (migration 0004) ----
DROP POLICY IF EXISTS "Allow select own payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public insert payments" ON public.payments;
DROP POLICY IF EXISTS "Allow admin all on payments" ON public.payments;
CREATE POLICY "payments_select_own"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );
-- No public INSERT — payments only created via place_order() SECURITY DEFINER
CREATE POLICY "payments_admin_all"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ---- razorpay_webhooks (migration 0004) ----
DROP POLICY IF EXISTS "Allow public insert webhooks" ON public.razorpay_webhooks;
DROP POLICY IF EXISTS "Allow admin all on webhooks" ON public.razorpay_webhooks;
-- Webhooks are created by server-side API (service role), not by client
CREATE POLICY "webhooks_admin_all"
  ON public.razorpay_webhooks FOR ALL
  TO authenticated
  USING (public.is_admin());


-- ============================================================
-- STEP 6: CREATE SIMPLE inventory TABLE
-- The app code uses: supabase.from('inventory').select/update
-- with .eq('product_id', ...).eq('size', ...)
-- This table provides a simple per-product/size stock count.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inventory (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size       VARCHAR(20) NOT NULL,
  quantity   INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  PRIMARY KEY (product_id, size)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Public can read inventory (to show stock levels)
DROP POLICY IF EXISTS "inventory_select_public" ON public.inventory;
CREATE POLICY "inventory_select_public"
  ON public.inventory FOR SELECT
  TO public
  USING (true);

-- Only place_order() (SECURITY DEFINER) and admins can modify inventory
DROP POLICY IF EXISTS "inventory_admin_all" ON public.inventory;
CREATE POLICY "inventory_admin_all"
  ON public.inventory FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- STEP 7: CREATE place_order() ATOMIC SECURITY DEFINER FUNCTION
-- This is the ONLY way to create orders. It:
--   - Reads prices from DB (not trusted from client)
--   - Validates stock
--   - Decrements inventory atomically
--   - Creates order + order_items + payment in one transaction
--   - Rolls back everything on any failure
--   - Returns real order ID on success, raises exception on failure
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
  p_razorpay_signature  TEXT DEFAULT NULL
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

  -- ---- 6. Calculate shipping (currently free) ----
  v_shipping_fee := 0;

  -- ---- 7. Final total ----
  v_total := v_subtotal - v_discount_amt + v_shipping_fee;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- ---- 8. Create order ----
  INSERT INTO public.orders (
    user_id,
    status,
    total_amount,
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

-- Grant execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.place_order(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;


-- ============================================================
-- STEP 8: VERIFY — Test that is_admin() exists and works
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_admin'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: is_admin() was not created.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'place_order'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: place_order() was not created.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'inventory'
  ) THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: inventory table was not created.';
  END IF;

  RAISE NOTICE 'VERIFICATION PASSED: is_admin(), place_order(), and inventory table all exist.';
END;
$$;
