import { supabase, withTimeout } from '@/lib/supabase';
import { MOCK_PRODUCTS } from '../page';
import ShopClient from './ShopClient';
import PageLoader from '@/components/PageLoader';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShopPage() {
  let dbProducts = [];
  let dbCategories = [];

  try {
    // 1. Fetch categories
    const catRes: any = await withTimeout(
      supabase.from('categories').select('*')
    );
    if (catRes?.data) dbCategories = catRes.data;

    // 2. Fetch products with 1s timeout safeguard
    const prodRes: any = await withTimeout(
      supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('is_hidden', false)
    );
    
    const prodData = prodRes?.data;
    if (prodData && prodData.length > 0) {
      dbProducts = prodData.map((prod: any) => ({
        ...prod,
        category: prod.category ? { name: (prod.category as any).name } : undefined,
        product_images: prod.product_images || [],
        inventory: prod.inventory || []
      }));
    }
  } catch (err) {
    console.error('Error fetching shop data from Supabase, using mocks:', err);
  }

  const finalProducts = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;
  
  // Set default categories if database is empty
  const defaultCategories = [
    { id: 'cat-limited-edition', name: 'Limited Edition', slug: 'limited-edition' },
    { id: 'cat-on-fire', name: 'On Fire', slug: 'on-fire' },
    { id: 'cat-graphic-tee', name: 'Graphic Tee', slug: 'graphic-tee' },
    { id: 'cat-psychology-edition', name: 'Psychology Edition', slug: 'psychology-edition' }
  ];

  // Merge database categories with default categories to ensure all 4 exist
  const combinedCategories = [...dbCategories];
  for (const defCat of defaultCategories) {
    if (!combinedCategories.some(c => c.slug === defCat.slug || c.name.toLowerCase() === defCat.name.toLowerCase())) {
      combinedCategories.push(defCat);
    }
  }

  const finalCategories = combinedCategories.length > 0 ? combinedCategories : defaultCategories;

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-10 overflow-x-hidden">
      <Suspense fallback={<PageLoader fullScreen={false} />}>
        <ShopClient initialProducts={finalProducts as any} categories={finalCategories as any} />
      </Suspense>
    </div>
  );
}
