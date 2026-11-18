import { supabase, withTimeout } from '@/lib/supabase';
import HomeClientWrapper from './HomeClientWrapper';

// Served from the ISR cache and rebuilt in the background at most once a
// minute. Admin edits call refreshStorefront() to update it immediately.
export const revalidate = 60;

const FALLBACK_IMAGES = [
  '/products/farebi-olive.jpg',
  '/products/polarize-cream.jpg',
  '/products/polarize-navy.jpg',
  '/products/mard-paisa-maroon.jpg'
];

export default async function HomePage() {
  // Both queries are independent, so run them in parallel.
  const [heroRes, res]: any[] = await Promise.all([
    withTimeout(
      supabase.from('hero_slides').select('*').order('sort_order', { ascending: true })
    ),
    withTimeout(
      supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
    ),
  ]);

  // Throwing (instead of rendering an empty catalog) makes ISR keep serving
  // the last good version of the page if Supabase is briefly unreachable.
  if (!res || res.error) {
    throw new Error(`Home: failed to load products (${res?.error?.message ?? 'timeout'})`);
  }

  const heroSlides: any[] = heroRes?.data || [];
  const dbProducts: any[] = (res.data || []).map((prod: any, index: number) => {
    const rawImages = prod.product_images || [];
    const validImages = rawImages.length > 0
      ? rawImages
      : [{ image_url: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] }];

    return {
      ...prod,
      category: prod.category ? (prod.category as any).name : 'Oversized Tees',
      product_images: validImages,
      inventory: prod.inventory || []
    };
  });

  return (
    <HomeClientWrapper products={dbProducts} heroSlides={heroSlides} />
  );
}
