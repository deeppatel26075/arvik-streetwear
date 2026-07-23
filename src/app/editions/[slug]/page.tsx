import { supabase } from '@/lib/supabase';
import { MOCK_PRODUCTS } from '../../page';
import EditionClient from './EditionClient';
import { notFound } from 'next/navigation';

interface EditionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditionDetailPage({ params }: EditionPageProps) {
  const { slug } = await params;
  let dbEdition = null;
  let dbProducts: any[] = [];

  try {
    // 1. Fetch active edition & theme
    const { data: editionData } = await supabase
      .from('editions')
      .select('*, theme:edition_themes(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (editionData) {
      dbEdition = editionData;
      
      // 2. Fetch products associated with this edition
      const { data: prods } = await supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('edition_id', editionData.id)
        .eq('is_hidden', false);

      if (prods) {
        dbProducts = prods.map((p) => ({
          ...p,
          category: p.category ? { name: (p.category as any).name } : undefined,
          product_images: p.product_images || [],
          inventory: p.inventory || []
        }));
      }
    }
  } catch (err) {
    console.error(`Error loading edition detail for ${slug}:`, err);
  }

  // Fallbacks
  const edition = dbEdition || getMockEdition(slug);
  const products = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

  if (!edition) {
    return notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <EditionClient edition={edition as any} products={products as any} />
    </div>
  );
}

function getMockEdition(slug: string) {
  const list = [
    {
      id: 'e001',
      name: 'Samurai Edition',
      slug: 'samurai',
      description: 'Ancient Ronin aesthetic featuring dynamic brush strokes and dark crimson contrasts.',
      theme: { preset_name: 'samurai', primary_color: '#dc2626' }
    },
    {
      id: 'e002',
      name: 'Anime Edition',
      slug: 'anime',
      description: 'Future pop capsule featuring electric purple hues and Japanese typographical overlays.',
      theme: { preset_name: 'anime', primary_color: '#a855f7' }
    },
    {
      id: 'e003',
      name: 'Vintage Edition',
      slug: 'vintage',
      description: 'Lined paper vintage cream patterns, raw textures, and retro sepia print details.',
      theme: { preset_name: 'vintage', primary_color: '#7c2d12' }
    }
  ];
  return list.find((e) => e.slug === slug) || null;
}
