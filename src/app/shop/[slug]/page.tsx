import { supabase, withTimeout } from '@/lib/supabase';
import ProductDetailClient from './ProductDetailClient';
import ProductDetailFallback from './ProductDetailFallback';
import { findColorVariants } from '@/lib/colorVariants';

// ISR: each product page is rendered on its first visit, then served from
// cache and rebuilt in the background at most once a minute. Admin edits
// call refreshStorefront() so changes still show up immediately.
export const revalidate = 60;

// Empty list = prerender nothing at build time, but still cache every
// product page on demand (required for ISR on a dynamic route).
export async function generateStaticParams() {
  return [];
}

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  // All three queries are keyed off the slug, so they go out in parallel —
  // one Supabase round trip for the page instead of five sequential ones.
  const [res, storyRes, allProdRes]: any[] = await Promise.all([
    withTimeout(
      supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('slug', slug)
        .eq('is_hidden', false).not('slug', 'like', 'custom-tee%')
        .single()
    ),
    // Fetched separately (not embedded above) so that a missing/pending
    // product_story_panels migration degrades to the frontend's own
    // gallery-photo fallback instead of taking down the whole product page.
    withTimeout(
      supabase
        .from('product_story_panels')
        .select('image_url, caption, display_order, products!inner(slug)')
        .eq('products.slug', slug)
        .order('display_order')
    ),
    // Every visible product: used both for sibling color variants and for
    // the "related products" row, so it replaces two extra queries.
    withTimeout(
      supabase
        .from('products')
        .select('id, name, slug, description, price, discount_price, is_hidden, category_id, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('is_hidden', false).not('slug', 'like', 'custom-tee%')
    ),
  ]);

  // A timeout or a real DB error (anything other than ".single() found no
  // row") must not be cached as "product not found" — throw so ISR keeps
  // serving the last good version instead.
  if (!res || (res.error && res.error.code !== 'PGRST116')) {
    throw new Error(`Product ${slug}: failed to load (${res?.error?.message ?? 'timeout'})`);
  }

  const data = res.data;
  if (!data) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <ProductDetailFallback slug={slug} />
      </div>
    );
  }

  const product = {
    ...data,
    category: data.category ? { name: (data.category as any).name } : undefined,
    product_images: data.product_images || [],
    inventory: data.inventory || [],
    product_story_panels: (storyRes?.data || []).map(({ products: _p, ...panel }: any) => panel),
  };

  const allProds: any[] = allProdRes?.data || [];

  let colorVariants: any[] = [];
  try {
    colorVariants = findColorVariants(product, allProds);
  } catch (err) {
    console.error('Error finding color variants:', err);
  }

  // Prefer other products from the same category; if the catalog doesn't
  // have any yet, fall back to any other products so the section still
  // has something to show.
  const others = allProds.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => p.category_id === product.category_id);
  const relatedProducts = (sameCategory.length > 0 ? sameCategory : others)
    .slice(0, 4)
    .map((p: any) => ({
      ...p,
      category: p.category ? { name: p.category.name } : undefined,
      product_images: p.product_images || [],
      inventory: p.inventory || []
    }));

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <ProductDetailClient
        product={product as any}
        relatedProducts={relatedProducts as any}
        colorVariants={colorVariants}
      />
    </div>
  );
}
