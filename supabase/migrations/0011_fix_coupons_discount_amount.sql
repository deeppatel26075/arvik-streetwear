-- Migration 0011: Add missing coupons columns (discount_amount, min_order_value)
--
-- 0004_orders.sql defines public.coupons with discount_amount and
-- min_order_value columns, but used CREATE TABLE IF NOT EXISTS — a
-- coupons table already existed in this database from an earlier
-- ad-hoc schema (without these two columns), so 0004 silently skipped
-- creating them, and place_order() started failing with "column ...
-- does not exist" the moment a real checkout ran the function that
-- selects them. information_schema.columns confirmed only 7 of the 9
-- expected columns exist on production — this backfills the other 2.

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) CHECK (discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(10, 2) DEFAULT 0.00;
