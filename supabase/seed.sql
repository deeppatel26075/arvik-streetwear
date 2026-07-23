-- Seed data for ARVIIK Streetwear Platform

-- 1. Insert Currencies
INSERT INTO public.currencies (code, symbol, exchange_rate, is_active) VALUES
('INR', '₹', 1.000000, true),
('USD', '$', 0.012000, true)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Warehouses
INSERT INTO public.warehouses (name, code, address, city, country, is_active) VALUES
('Mumbai Primary Fulfillment Hub', 'WH-MUM-01', '45 Fashion House Road, Andheri East', 'Mumbai', 'India', true),
('Delhi Regional Hub', 'WH-DEL-02', '12 Warehouse Lane, Okhla Phase 3', 'Delhi', 'India', true)
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Categories
INSERT INTO public.categories (name, slug) VALUES
('Oversized', 'oversized'),
('Graphic Prints', 'graphic-prints'),
('Minimalist Typo', 'minimalist-typo')
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Editions
INSERT INTO public.editions (id, name, slug, description, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'Samurai Edition', 'samurai', 'An aesthetic of Ronin brush strokes and dark crimson contrasts.', true),
('e0000000-0000-0000-0000-000000000002', 'Anime Edition', 'anime', 'Futuristic pop-culture drop featuring classic Japanese typography overlays.', true),
('e0000000-0000-0000-0000-000000000003', 'Vintage Edition', 'vintage', 'Cream tones, raw outlines, and retro sepia print outlines.', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Edition Themes
INSERT INTO public.edition_themes (
    edition_id,
    preset_name,
    primary_color,
    secondary_color,
    bg_color,
    secondary_bg_color,
    text_color,
    secondary_text_color,
    border_color,
    card_bg_color,
    border_radius,
    font_family_heading,
    font_family_body,
    cursor_style,
    loading_animation,
    bg_music_url,
    bg_texture_url,
    scroll_animation_preset,
    card_hover_preset,
    particle_effects,
    icon_pack,
    seo_metadata,
    sound_effects,
    custom_css_variables
) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'Streetwear',
    '#991b1b',
    '#111111',
    '#FFFFFF',
    '#F7F7F7',
    '#111111',
    '#666666',
    '#ECECEC',
    '#FFFFFF',
    '18px',
    'Inter',
    'Inter',
    'default',
    'fade',
    null,
    null,
    'none',
    'scale-up',
    '{}',
    'lucide',
    '{"title": "Samurai Edition | ARVIIK"}',
    '{}',
    '{}'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'Anime',
    '#a855f7',
    '#1e1b4b',
    '#FFFFFF',
    '#F7F7F7',
    '#111111',
    '#666666',
    '#ECECEC',
    '#FFFFFF',
    '18px',
    'Inter',
    'Inter',
    'default',
    'fade',
    null,
    null,
    'none',
    'scale-up',
    '{}',
    'lucide',
    '{"title": "Anime Capsule | ARVIIK"}',
    '{}',
    '{}'
),
(
    'e0000000-0000-0000-0000-000000000003',
    'Vintage',
    '#7c2d12',
    '#7c2d12',
    '#FFFFFF',
    '#F7F7F7',
    '#111111',
    '#666666',
    '#ECECEC',
    '#FFFFFF',
    '18px',
    'Inter',
    'Inter',
    'default',
    'fade',
    null,
    null,
    'none',
    'scale-up',
    '{}',
    'lucide',
    '{"title": "Archive Vintage | ARVIIK"}',
    '{}',
    '{}'
)
ON CONFLICT (edition_id) DO NOTHING;

-- 6. Insert Products
INSERT INTO public.products (
    id,
    name,
    slug,
    description,
    price,
    discount_price,
    category_id,
    edition_id,
    fabric,
    gsm,
    fit_type,
    wash_instructions,
    is_featured,
    is_hidden,
    sku_base,
    barcode
) VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    'FAREBI OVERSIZED OLIVE TEE',
    'farebi-oversized-olive-tee',
    'Heavyweight oversized drop shoulder Dark Olive T-shirt featuring a high-density "FAREBI" print on the chest.',
    1499.00,
    1299.00,
    (SELECT id FROM public.categories WHERE slug='graphic-prints' LIMIT 1),
    'e0000000-0000-0000-0000-000000000001',
    '100% French Terry Cotton',
    '240 GSM',
    'Oversized Boxy Fit',
    'Cold wash inside out.',
    true,
    false,
    'ARV-FRB-OLV',
    '8901020304051'
),
(
    'p0000000-0000-0000-0000-000000000002',
    'POLARIZE VINTAGE CREAM TEE',
    'polarize-vintage-cream-tee',
    'Vintage cream drop shoulder graphic T-shirt.',
    1299.00,
    999.00,
    (SELECT id FROM public.categories WHERE slug='graphic-prints' LIMIT 1),
    'e0000000-0000-0000-0000-000000000003',
    '100% Ring-spun Cotton',
    '240 GSM',
    'Oversized Fit',
    'Cold wash inside out.',
    true,
    false,
    'ARV-PLZ-CRM',
    '8901020304052'
),
(
    'p0000000-0000-0000-0000-000000000003',
    'MARD PAISA BURGUNDY TEE',
    'mard-paisa-burgundy-tee',
    'Maroon oversized streetwear drop.',
    1499.00,
    1199.00,
    (SELECT id FROM public.categories WHERE slug='minimalist-typo' LIMIT 1),
    'e0000000-0000-0000-0000-000000000002',
    '100% Combed Premium Cotton',
    '240 GSM',
    'Oversized Boxy Fit',
    'Do not iron print.',
    true,
    false,
    'ARV-MRD-BGD',
    '8901020304053'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Product Images
INSERT INTO public.product_images (product_id, image_url, display_order) VALUES
('p0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600', 0),
('p0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600', 0),
('p0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600', 0);

-- 8. Insert Product Variants
INSERT INTO public.product_variants (id, product_id, size, color_name, color_hex, sku) VALUES
('v0000000-0000-0000-0000-000000000011', 'p0000000-0000-0000-0000-000000000001', 'S', 'Olive Green', '#3f6212', 'ARV-FRB-OLV-S'),
('v0000000-0000-0000-0000-000000000012', 'p0000000-0000-0000-0000-000000000001', 'M', 'Olive Green', '#3f6212', 'ARV-FRB-OLV-M'),
('v0000000-0000-0000-0000-000000000013', 'p0000000-0000-0000-0000-000000000001', 'L', 'Olive Green', '#3f6212', 'ARV-FRB-OLV-L'),
('v0000000-0000-0000-0000-000000000021', 'p0000000-0000-0000-0000-000000000002', 'S', 'Vintage Cream', '#fafaf9', 'ARV-PLZ-CRM-S'),
('v0000000-0000-0000-0000-000000000022', 'p0000000-0000-0000-0000-000000000002', 'M', 'Vintage Cream', '#fafaf9', 'ARV-PLZ-CRM-M'),
('v0000000-0000-0000-0000-000000000023', 'p0000000-0000-0000-0000-000000000002', 'L', 'Vintage Cream', '#fafaf9', 'ARV-PLZ-CRM-L'),
('v0000000-0000-0000-0000-000000000031', 'p0000000-0000-0000-0000-000000000003', 'S', 'Burgundy Maroon', '#881337', 'ARV-MRD-BGD-S'),
('v0000000-0000-0000-0000-000000000032', 'p0000000-0000-0000-0000-000000000003', 'M', 'Burgundy Maroon', '#881337', 'ARV-MRD-BGD-M'),
('v0000000-0000-0000-0000-000000000033', 'p0000000-0000-0000-0000-000000000003', 'L', 'Burgundy Maroon', '#881337', 'ARV-MRD-BGD-L')
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Warehouse Inventories
INSERT INTO public.warehouse_inventory (variant_id, warehouse_id, stock_quantity) VALUES
('v0000000-0000-0000-0000-000000000011', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 25),
('v0000000-0000-0000-0000-000000000012', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 40),
('v0000000-0000-0000-0000-000000000013', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 30),
('v0000000-0000-0000-0000-000000000021', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 15),
('v0000000-0000-0000-0000-000000000022', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 20),
('v0000000-0000-0000-0000-000000000023', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 25),
('v0000000-0000-0000-0000-000000000031', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 10),
('v0000000-0000-0000-0000-000000000032', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 15),
('v0000000-0000-0000-0000-000000000033', (SELECT id FROM public.warehouses WHERE code='WH-MUM-01' LIMIT 1), 8);
