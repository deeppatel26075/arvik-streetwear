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
        inventory: data.inventory || []
      };
    }
  } catch (err) {
    console.error(`Error loading product details for ${slug}:`, err);
  }

  const product = dbProduct;

  if (!product) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <ProductDetailFallback slug={slug} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <ProductDetailClient product={product as any} />
    </div>
  );
}
