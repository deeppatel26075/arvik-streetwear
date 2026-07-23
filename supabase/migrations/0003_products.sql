-- Migration 0003: Products, Inventory, and Bundles

-- Create Warehouses Table
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    discount_price DECIMAL(10, 2) CHECK (discount_price >= 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    edition_id UUID REFERENCES public.editions(id) ON DELETE SET NULL,
    fabric VARCHAR(255) DEFAULT '100% Premium Cotton',
    gsm VARCHAR(50) DEFAULT '240 GSM',
    fit_type VARCHAR(255) DEFAULT 'Oversized Fit',
    wash_instructions TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    is_preorder BOOLEAN DEFAULT false,
    preorder_release_date TIMESTAMP WITH TIME ZONE,
    sku_base VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    video_url TEXT,
    images_360 TEXT[],
    size_chart_image TEXT,
    print_positions VARCHAR(100)[] DEFAULT ARRAY['Front', 'Back'],
    tags VARCHAR(100)[],
    limited_edition_countdown TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_discount_price CHECK (discount_price IS NULL OR discount_price <= price)
);

-- Create Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Product Variants Table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    size VARCHAR(50) NOT NULL,
    color_name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(50) DEFAULT '#000000',
    sku VARCHAR(100) UNIQUE,
    price_override DECIMAL(10, 2) CHECK (price_override >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Warehouse Inventory Table
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(variant_id, warehouse_id)
);

-- Create Inventory History Table
CREATE TABLE IF NOT EXISTS public.inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    change_amount INT NOT NULL,
    reason VARCHAR(255) NOT NULL, -- 'purchase', 'restock', 'return', 'manual'
    admin_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Product Bundles Table
CREATE TABLE IF NOT EXISTS public.product_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    products_included UUID[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Frequently Bought Together Table
CREATE TABLE IF NOT EXISTS public.frequently_bought_together (
    product_a UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_b UUID REFERENCES public.products(id) ON DELETE CASCADE,
    confidence_score DECIMAL(5, 4) DEFAULT 1.0000,
    PRIMARY KEY (product_a, product_b)
);

-- Apply triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequently_bought_together ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public select on warehouses" ON public.warehouses FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Allow public select on products" ON public.products FOR SELECT TO public USING (is_hidden = false OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow public select on product images" ON public.product_images FOR SELECT TO public USING (true);
CREATE POLICY "Allow public select on variants" ON public.product_variants FOR SELECT TO public USING (true);
CREATE POLICY "Allow public select on warehouse inventory" ON public.warehouse_inventory FOR SELECT TO public USING (true);
CREATE POLICY "Allow public select on product bundles" ON public.product_bundles FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Allow public select on frequently bought" ON public.frequently_bought_together FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin all on warehouses" ON public.warehouses FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on products" ON public.products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on product images" ON public.product_images FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on variants" ON public.product_variants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on warehouse inventory" ON public.warehouse_inventory FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on inventory history" ON public.inventory_history FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on product bundles" ON public.product_bundles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on frequently bought" ON public.frequently_bought_together FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
