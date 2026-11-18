import { supabase, withTimeout } from '@/lib/supabase';
import ShopClient from './ShopClient';
import PageLoader from '@/components/PageLoader';
import { Suspense } from 'react';

// Served from the ISR cache and rebuilt in the background at most once a
// minute. Admin edits call refreshStorefront() to update it immediately.
export const revalidate = 60;

export default async function ShopPage() {
  // Independent queries — run in parallel.
  const [catRes, prodRes]: any[] = await Promise.all([
    withTimeout(supabase.from('categories').select('*')),
    withTimeout(
      supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('is_hidden', false)
    ),
  ]);

  // Don't let ISR cache an empty shop during a brief Supabase outage —
  // throwing keeps the last good version being served.
  if (!prodRes || prodRes.error) {
    throw new Error(`Shop: failed to load products (${prodRes?.error?.message ?? 'timeout'})`);
  }

  const dbCategories: any[] = catRes?.data || [];
  const dbProducts = (prodRes.data || []).map((prod: any) => ({
    ...prod,
    category: prod.category ? { name: (prod.category as any).name } : undefined,
    product_images: prod.product_images || [],
    inventory: prod.inventory || []
  }));

  const finalProducts = dbProducts;

  // Set default categories if database is empty
  const defaultCategories = [
    { id: 'cat-limited-edition', name: 'Limited Edition', slug: 'limited-edition' },
    { id: 'cat-on-fire', name: 'On Fire', slug: 'on-fire' },
    { id: 'cat-psychology-edition', name: 'Psychology Edition', slug: 'psychology-edition' }
  ];

  // Merge database categories with default categories to ensure all 3 exist
  const combinedCategories = [...dbCategories];
  for (const defCat of defaultCategories) {
    if (!combinedCategories.some(c => c.slug === defCat.slug || c.name.toLowerCase() === defCat.name.toLowerCase())) {
      combinedCategories.push(defCat);
    }
  }

  // Hidden categories: no longer shown as shop filter chips
  const HIDDEN_CATEGORY_NAMES = ['anime', 'graphic tee', 'graphic prints'];
  const filteredCategories = combinedCategories.filter(
    (c) => !HIDDEN_CATEGORY_NAMES.includes(c.name.toLowerCase())
  );

  const finalCategories = filteredCategories.length > 0 ? filteredCategories : defaultCategories;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-10 overflow-x-hidden">
      <Suspense fallback={<PageLoader fullScreen={false} />}>
        <ShopClient initialProducts={finalProducts as any} categories={finalCategories as any} />
      </Suspense>
    </div>
  );
}
