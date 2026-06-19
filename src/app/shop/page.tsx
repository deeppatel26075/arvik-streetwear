import { supabase } from '@/lib/supabase';
import { MOCK_PRODUCTS } from '../page';
import ShopClient from './ShopClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  let dbProducts = [];
  let dbCategories = [];
  let dbSettings: any[] = [];

  try {
    // 1. Fetch categories
    const { data: catData } = await supabase
      .from('categories')
      .select('*');
    if (catData) dbCategories = catData;

    // 2. Fetch products
    const { data: prodData } = await supabase
      .from('products')
      .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
      .eq('is_hidden', false);
    
    if (prodData && prodData.length > 0) {
      dbProducts = prodData.map(prod => ({
        ...prod,
        category: prod.category ? { name: (prod.category as any).name } : undefined,
        product_images: prod.product_images || [],
        inventory: prod.inventory || []
      }));
    }

    // 3. Fetch settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('*');
    if (settingsData) dbSettings = settingsData;

  } catch (err) {
    console.error('Error fetching shop data from Supabase, using mocks:', err);
  }

  const finalProducts = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;
  
  // Set default categories if database is empty
  const finalCategories = dbCategories.length > 0 ? dbCategories : [
    { id: 'cat-001', name: 'Graphic Prints', slug: 'graphic-prints' },
    { id: 'cat-002', name: 'Minimalist Typo', slug: 'minimalist-typo' }
  ];

  const settingsMap = dbSettings.reduce((acc: any, item: any) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Suspense fallback={
        <div className="flex justify-center items-center py-20 text-xs font-bold uppercase tracking-widest text-stone-400">
          Loading drops...
        </div>
      }>
        <ShopClient 
          initialProducts={finalProducts as any} 
          categories={finalCategories as any} 
          settings={settingsMap}
        />
      </Suspense>
    </div>
  );
}
