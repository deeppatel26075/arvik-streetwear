-- Migration 0005: Media Library and ARVIIK Studio Settings

-- Create Central Media Library Table
CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    size_bytes INT NOT NULL,
    folder_path VARCHAR(255) DEFAULT '/',
    tags VARCHAR(100)[],
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Homepage Sections Table
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    settings JSONB DEFAULT '{}',
    schedule_start TIMESTAMP WITH TIME ZONE,
    schedule_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Navigation Menus Table
CREATE TABLE IF NOT EXISTS public.navigation_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Apply triggers
CREATE TRIGGER update_homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public select on media library" ON public.media_library FOR SELECT TO public USING (true);
CREATE POLICY "Allow public select on homepage sections" ON public.homepage_sections FOR SELECT TO public USING (is_enabled = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow public select on menus" ON public.navigation_menus FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin all on media library" ON public.media_library FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on homepage sections" ON public.homepage_sections FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admin all on menus" ON public.navigation_menus FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
