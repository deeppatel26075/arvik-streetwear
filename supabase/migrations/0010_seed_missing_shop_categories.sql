-- Migration 0010: Seed real category rows for the site sections the shop
-- page always shows as filter chips (Limited Edition, On Fire, Psychology
-- Edition) — see the `defaultCategories` array in src/app/shop/page.tsx.
--
-- Those chips were previously backed by fake, non-UUID placeholder ids
-- (e.g. 'cat-limited-edition') injected client-side in the admin panel's
-- category dropdown, which don't exist as real rows here. Picking one of
-- them for a product's category and saving would fail outright, since
-- products.category_id is a UUID foreign key into this table. Creating
-- real rows lets admins actually assign products to these categories.

INSERT INTO public.categories (name, slug) VALUES
  ('Limited Edition', 'limited-edition'),
  ('On Fire', 'on-fire'),
  ('Psychology Edition', 'psychology-edition')
ON CONFLICT (slug) DO NOTHING;
