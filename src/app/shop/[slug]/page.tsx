import { supabase, withTimeout } from '@/lib/supabase';
import ProductDetailClient from './ProductDetailClient';
import ProductDetailFallback from './ProductDetailFallback';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  let dbProduct = null;

  try {
    const res: any = await withTimeout(
      supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('slug', slug)
        .eq('is_hidden', false)
        .single()
    );

    const data = res?.data;
    if (data) {
      dbProduct = {
        ...data,
        category: data.category ? { name: (data.category as any).name } : undefined,
        product_images: data.product_images || [],
        inventory: data.inventory || [],
        product_story_panels: [] as any[]
      };
    }
  } catch (err) {
    console.error(`Error loading product details for ${slug}:`, err);
  }

  // Fetched separately (not embedded above) so that a missing/pending
  // product_story_panels migration degrades to the frontend's own
  // gallery-photo fallback instead of taking down the whole product page.
  if (dbProduct) {
    try {
      const storyRes: any = await withTimeout(
        supabase
          .from('product_story_panels')
          .select('image_url, caption, display_order')
          .eq('product_id', dbProduct.id)
          .order('display_order')
      );
      dbProduct.product_story_panels = storyRes?.data || [];
    } catch (err) {
      console.error(`Error loading story panels for ${slug}:`, err);
    }
  }

  const product = dbProduct;

  if (!product) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <ProductDetailFallback slug={slug} />
      </div>
    );
  }

  let relatedProducts: any[] = [];
  try {
    const relSelect = 'id, name, slug, price, discount_price, category:categories(name), product_images(image_url), inventory(size, quantity)';

    const relRes: any = await withTimeout(
      supabase
        .from('products')
        .select(relSelect)
        .eq('is_hidden', false)
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(4)
    );
    let relData = relRes?.data || [];

    // Not enough other products in the same category yet (e.g. an early
    // catalog with only one product per category) — fall back to any
    // other products so the section still has something to show, rather
    // than sitting invisible until the catalog fills out.
    if (relData.length === 0) {
      const fallbackRes: any = await withTimeout(
        supabase
          .from('products')
          .select(relSelect)
          .eq('is_hidden', false)
          .neq('id', product.id)
          .limit(4)
      );
      relData = fallbackRes?.data || [];
    }

    relatedProducts = relData.map((p: any) => ({
      ...p,
      category: p.category ? { name: p.category.name } : undefined,
      product_images: p.product_images || [],
      inventory: p.inventory || []
    }));
  } catch (err) {
    console.error(`Error loading related products for ${slug}:`, err);
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <ProductDetailClient product={product as any} relatedProducts={relatedProducts as any} />
    </div>
  );
}
