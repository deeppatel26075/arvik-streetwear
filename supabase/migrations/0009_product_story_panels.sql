-- Migration 0009: Product Story panels — per-product curated photos +
-- captions for the "Product Story" carousel, editable from the admin
-- panel. Falls back to the product's own gallery photos + generic
-- captions on the frontend when a product has none of these yet.

CREATE TABLE IF NOT EXISTS public.product_story_panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_story_panels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on product story panels" ON public.product_story_panels
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin all on product story panels" ON public.product_story_panels
  FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
