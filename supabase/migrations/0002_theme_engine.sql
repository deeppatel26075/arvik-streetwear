-- Migration 0002: Theme Engine & Dynamic Editions

-- Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Editions Table
CREATE TABLE IF NOT EXISTS public.editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_scheduled BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Edition Themes Table
CREATE TABLE IF NOT EXISTS public.edition_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_id UUID UNIQUE REFERENCES public.editions(id) ON DELETE CASCADE,
    preset_name VARCHAR(100) DEFAULT 'Minimal',
    primary_color VARCHAR(50) DEFAULT '#111111',
    secondary_color VARCHAR(50) DEFAULT '#666666',
    bg_color VARCHAR(50) DEFAULT '#FFFFFF',
    secondary_bg_color VARCHAR(50) DEFAULT '#F7F7F7',
    text_color VARCHAR(50) DEFAULT '#111111',
    secondary_text_color VARCHAR(50) DEFAULT '#666666',
    border_color VARCHAR(50) DEFAULT '#ECECEC',
    card_bg_color VARCHAR(50) DEFAULT '#FFFFFF',
    border_radius VARCHAR(50) DEFAULT '18px',
    font_family_heading VARCHAR(100) DEFAULT 'Inter',
    font_family_body VARCHAR(100) DEFAULT 'Inter',
    cursor_style VARCHAR(100) DEFAULT 'default',
    loading_animation VARCHAR(100) DEFAULT 'fade',
    bg_music_url TEXT,
    bg_texture_url TEXT,
    scroll_animation_preset VARCHAR(100) DEFAULT 'none',
    card_hover_preset VARCHAR(100) DEFAULT 'scale-up',
    button_styles JSONB DEFAULT '{}',
    card_styles JSONB DEFAULT '{}',
    animation_presets JSONB DEFAULT '{}',
    particle_effects JSONB DEFAULT '{}',
    icon_pack VARCHAR(100) DEFAULT 'lucide',
    seo_metadata JSONB DEFAULT '{}',
    sound_effects JSONB DEFAULT '{}',
    custom_css_variables JSONB DEFAULT '{}',
    custom_css TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Edition Landing Blocks Table
CREATE TABLE IF NOT EXISTS public.edition_landing_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    settings JSONB DEFAULT '{}',
    schedule_start TIMESTAMP WITH TIME ZONE,
    schedule_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Apply triggers
CREATE TRIGGER update_editions_updated_at BEFORE UPDATE ON public.editions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_edition_themes_updated_at BEFORE UPDATE ON public.edition_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_landing_blocks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public select on categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Allow public select on editions" ON public.editions FOR SELECT TO public USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow public select on themes" ON public.edition_themes FOR SELECT TO public USING (true);
CREATE POLICY "Allow public select on landing blocks" ON public.edition_landing_blocks FOR SELECT TO public USING (is_enabled = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin all on categories" ON public.categories FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on editions" ON public.editions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on themes" ON public.edition_themes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on landing blocks" ON public.edition_landing_blocks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
