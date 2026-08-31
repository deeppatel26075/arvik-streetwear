-- ============================================================
-- ARVIIK URGENT SECURITY FIX: site_settings exposure
-- Run this in: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================
-- site_settings currently allows public (anon) SELECT on every row,
-- including a "payment_config" row that stores a Razorpay key_secret
-- in plaintext. Nothing on the public-facing site actually reads this
-- table (only the admin settings page does), so the safe fix is to
-- restrict ALL access to admins only.
--
-- IMPORTANT: This does not rotate the exposed key_secret. You must
-- separately regenerate it in your Razorpay dashboard and update it
-- wherever it's configured — treat the current value as compromised.
-- ============================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop every existing policy on site_settings, regardless of name,
-- so this script is safe to re-run and doesn't depend on guessing
-- what the original (overly-permissive) policy was called.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.site_settings', pol.policyname);
  END LOOP;
END;
$$;

-- Only admins may read or write site_settings.
CREATE POLICY "site_settings_admin_all"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- VERIFY
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings'
      AND policyname = 'site_settings_admin_all'
  ) THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: site_settings_admin_all policy was not created.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings'
      AND policyname <> 'site_settings_admin_all'
  ) THEN
    RAISE EXCEPTION 'VERIFICATION FAILED: an old, extra policy still exists on site_settings.';
  END IF;

  RAISE NOTICE 'VERIFICATION PASSED: site_settings is now admin-only.';
END;
$$;
