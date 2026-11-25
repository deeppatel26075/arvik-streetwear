-- Customize (design your own tee)
-- Run once in: Supabase Dashboard -> SQL Editor -> Run. Safe to re-run.
--
-- Creates:
--   1. customizer_colors   tee colours customers can pick (edited in Admin -> Customizer)
--   2. Two products the custom tee is sold as (prices editable in Admin -> Products):
--        custom-tee       front design only        ₹999
--        custom-tee-plus  front + back/sleeve      ₹1199 (₹999 + ₹200)
--   3. custom_designs      each customer's design, linked to the order once placed
--   4. custom-designs      storage bucket for uploaded artwork and design previews

-- ---------------------------------------------------------------
-- 1. Colours
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customizer_colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    hex VARCHAR(9) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.customizer_colors (name, hex, sort_order)
SELECT * FROM (VALUES
  ('Jet Black', '#141414', 1),
  ('Off White', '#f1efe9', 2),
  ('Heather Grey', '#b8b8b4', 3),
  ('Sand Beige', '#d6c4a4', 4),
  ('Midnight Navy', '#1e2a45', 5),
  ('Army Olive', '#5a5d3b', 6),
  ('Deep Maroon', '#5d1f27', 7)
) AS v(name, hex, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.customizer_colors);

ALTER TABLE public.customizer_colors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customizer_colors_public_select" ON public.customizer_colors;
DROP POLICY IF EXISTS "customizer_colors_admin_all" ON public.customizer_colors;
CREATE POLICY "customizer_colors_public_select" ON public.customizer_colors
  FOR SELECT TO public USING (true);
CREATE POLICY "customizer_colors_admin_all" ON public.customizer_colors
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------
-- 2. The products a custom tee is ordered as. They're visible (orders
--    need that) but the storefront filters out the "custom-tee" slugs, so
--    they never appear in the shop, search or home page.
-- ---------------------------------------------------------------
INSERT INTO public.products (name, slug, description, price, is_hidden)
VALUES
  ('Custom Tee', 'custom-tee', 'Your own design, front print, on the ARVIIK oversized 240 GSM tee.', 999, false),
  ('Custom Tee (Front + Back)', 'custom-tee-plus', 'Your own design, front plus back/sleeve prints, on the ARVIIK oversized 240 GSM tee.', 1199, false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.inventory (product_id, size, quantity)
SELECT p.id, s.size, 9999
FROM public.products p
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL')) AS s(size)
WHERE p.slug IN ('custom-tee', 'custom-tee-plus')
ON CONFLICT (product_id, size) DO NOTHING;

-- ---------------------------------------------------------------
-- 3. Designs
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    size VARCHAR(10) NOT NULL,
    color_name VARCHAR(60) NOT NULL,
    color_hex VARCHAR(9) NOT NULL,
    design JSONB NOT NULL,
    preview_front TEXT,
    preview_back TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS custom_designs_order_idx ON public.custom_designs(order_id);

ALTER TABLE public.custom_designs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_designs_insert_own" ON public.custom_designs;
DROP POLICY IF EXISTS "custom_designs_select_own_or_admin" ON public.custom_designs;
DROP POLICY IF EXISTS "custom_designs_link_own_order" ON public.custom_designs;
DROP POLICY IF EXISTS "custom_designs_admin_all" ON public.custom_designs;

CREATE POLICY "custom_designs_insert_own" ON public.custom_designs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND order_id IS NULL);

CREATE POLICY "custom_designs_select_own_or_admin" ON public.custom_designs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- A customer can attach their own, not-yet-ordered design to their own order.
CREATE POLICY "custom_designs_link_own_order" ON public.custom_designs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND order_id IS NULL)
  WITH CHECK (
    user_id = auth.uid()
    AND order_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "custom_designs_admin_all" ON public.custom_designs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------
-- 4. Storage for uploaded artwork + previews. Public read (the links are
--    random and needed in emails / admin); each signed-in customer can
--    only upload into their own folder: custom-designs/<user id>/...
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('custom-designs', 'custom-designs', true, 10485760,
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "custom_designs_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "custom_designs_storage_upload_own" ON storage.objects;
CREATE POLICY "custom_designs_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-designs');
CREATE POLICY "custom_designs_storage_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'custom-designs' AND (storage.foldername(name))[1] = auth.uid()::text);
