import { supabase, withTimeout } from '@/lib/supabase';
import HomeClientWrapper from './HomeClientWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let dbProducts: any[] = [];
  let heroSlides: any[] = [];

  try {
    const heroRes: any = await withTimeout(
      supabase.from('hero_slides').select('*').order('sort_order', { ascending: true })
    );
    heroSlides = heroRes?.data || [];
  } catch (err) {
    console.error('Error loading hero slides:', err);
  }

  try {
    const res: any = await withTimeout(
      supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
    );

    const prods = res?.data;
    
    if (prods && prods.length > 0) {
      dbProducts = prods.map((prod: any, index: number) => {
        const fallbacks = [
          '/products/farebi-olive.jpg',
          '/products/polarize-cream.jpg',
          '/products/polarize-navy.jpg',
          '/products/mard-paisa-maroon.jpg'
        ];
        const rawImages = prod.product_images || [];
        const validImages = rawImages.length > 0
          ? rawImages
          : [{ image_url: fallbacks[index % fallbacks.length] }];

        return {
          ...prod,
          category: prod.category ? (prod.category as any).name : 'Oversized Tees',
          product_images: validImages,
          inventory: prod.inventory || []
        };
      });
    }
  } catch (err) {
    console.error('Error loading Supabase products:', err);
  }

  return (
    <HomeClientWrapper products={dbProducts} heroSlides={heroSlides} />
  );
}
