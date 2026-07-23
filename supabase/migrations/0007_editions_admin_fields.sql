-- Migration 0007: Add Admin Fields to Editions Table for Dynamic Control
ALTER TABLE public.editions ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.editions ADD COLUMN IF NOT EXISTS artwork_url TEXT;
ALTER TABLE public.editions ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.editions ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Update RLS policies to reflect visibility controls
DROP POLICY IF EXISTS "Allow public select on editions" ON public.editions;
CREATE POLICY "Allow public select on editions" ON public.editions 
  FOR SELECT TO public 
  USING ((is_active = true AND is_visible = true) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
