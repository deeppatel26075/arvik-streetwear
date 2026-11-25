import type { Metadata } from 'next';
import { supabase, withTimeout } from '@/lib/supabase';
import CustomizeStudio, { type StudioColor, type StudioProduct } from './CustomizeStudio';

export const metadata: Metadata = {
  title: 'Customize | ARVIIK',
  description:
    'Design your own ARVIIK oversized tee: pick the colour, add your artwork, text or ARVIIK graphics on the front, back and sleeves.',
};

// Rebuilt at most every 30s; saving colours in admin refreshes it at once.
export const revalidate = 30;

const FALLBACK_COLORS: StudioColor[] = [
  { name: 'Jet Black', hex: '#141414' },
  { name: 'Off White', hex: '#f1efe9' },
  { name: 'Heather Grey', hex: '#b8b8b4' },
];

export default async function CustomizePage() {
  type Res<T> = { data: T[] | null } | null;
  type ProductRow = { id: string; name: string; slug: string; price: number; discount_price: number | null };
  const [colorRes, productRes] = (await Promise.all([
    withTimeout(supabase.from('customizer_colors').select('name, hex, sort_order').eq('is_active', true).order('sort_order')),
    withTimeout(
      supabase
        .from('products')
        .select('id, name, slug, price, discount_price')
        .in('slug', ['custom-tee', 'custom-tee-plus'])
        .eq('is_hidden', false)
    ),
  ])) as [Res<StudioColor>, Res<ProductRow>];

  const colors: StudioColor[] = colorRes?.data?.length ? colorRes.data : FALLBACK_COLORS;
  const rows: ProductRow[] = productRes?.data || [];
  const toProduct = (slug: string): StudioProduct | null => {
    const p = rows.find((r) => r.slug === slug);
    return p
      ? { id: p.id, name: p.name, slug: p.slug, price: Number(p.price), discountPrice: p.discount_price != null ? Number(p.discount_price) : undefined }
      : null;
  };

  return <CustomizeStudio colors={colors} base={toProduct('custom-tee')} plus={toProduct('custom-tee-plus')} />;
}
