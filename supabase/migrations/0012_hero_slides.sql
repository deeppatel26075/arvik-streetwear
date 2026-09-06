-- Homepage hero banner slides — lets admins edit the promo carousel
-- (image, copy, icon) and hide/show individual slides without a deploy.

CREATE TABLE IF NOT EXISTS public.hero_slides (
    id INTEGER PRIMARY KEY,
    badge VARCHAR(100) NOT NULL DEFAULT '',
    icon VARCHAR(50) NOT NULL DEFAULT 'Flame',
    title_main VARCHAR(100) NOT NULL DEFAULT '',
    title_highlight VARCHAR(100) NOT NULL DEFAULT '',
    subtitle VARCHAR(200) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with the 4 slides currently hardcoded on the homepage, so existing
-- copy carries over into the admin-editable table instead of resetting.
INSERT INTO public.hero_slides (id, badge, icon, title_main, title_highlight, subtitle, image_url, sort_order, is_hidden) VALUES
  (1, 'Limited Offer', 'Flame', 'Buy 2 Get', '10% Off', 'Limited Time Offer', '/products/polarize-navy.jpg', 1, false),
  (2, 'Bundle Deal', 'Shirt', 'Buy 3 Tees At', '₹1199', 'Use Code: B31199', '/products/farebi-olive.jpg', 2, false),
  (3, 'Pan-India', 'Truck', 'Free', 'Shipping', 'Across India · Orders Above ₹1499', '/products/mard-paisa-maroon.jpg', 3, false),
  (4, 'Prepaid Perk', 'Wallet', '10% Off', 'Prepaid', 'Pay Online & Save', '/products/polarize-cream.jpg', 4, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Allow admin all on hero slides" ON public.hero_slides;

-- Slide copy isn't sensitive, so the storefront reads every row (including
-- hidden ones) and decides what to render — simpler than juggling two
-- fetch paths for a value this low-stakes.
CREATE POLICY "Allow public select on hero slides" ON public.hero_slides
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin all on hero slides" ON public.hero_slides
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
