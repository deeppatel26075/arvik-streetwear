import { supabase } from '@/lib/supabase';
import { PRODUCTS } from '@/data/products';
import ShopClient from '@/app/shop/ShopClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  
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
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });
    
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
    console.error('Error fetching collection data, utilizing fallbacks:', err);
  }

  const allProducts = dbProducts.length > 0 ? dbProducts : PRODUCTS;
  const finalCategories = dbCategories.length > 0 ? dbCategories : [
    { id: 'cat-001', name: 'Graphic Prints', slug: 'graphic-prints' },
    { id: 'cat-002', name: 'Minimalist Typo', slug: 'minimalist-typo' },
    { id: 'cat-003', name: 'Plus Size', slug: 'plus-size' }
  ];

  const settingsMap = dbSettings.reduce((acc: any, item: any) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  // Pre-filter products based on slug
  let filteredProducts = [...allProducts];
  let collectionTitle = 'Streetwear Drop';

  if (slug === 'oversized' || slug === 'oversized-t-shirts') {
    filteredProducts = allProducts;
    collectionTitle = 'Oversized Collection';
  } else if (slug === 'graphic-prints' || slug === 'graphic-tees') {
    filteredProducts = allProducts.filter(
      p => p.category?.toLowerCase() === 'graphic prints' || 
           p.category?.name?.toLowerCase() === 'graphic prints'
    );
    collectionTitle = 'Graphic Printed Collection';
  } else if (slug === 'minimalist-typo' || slug === 'minimalist-tees') {
    filteredProducts = allProducts.filter(
      p => p.category?.toLowerCase() === 'minimalist typo' || 
           p.category?.name?.toLowerCase() === 'minimalist typo'
    );
    collectionTitle = 'Minimalist Typo Collection';
  } else if (slug === 'plus-size') {
    filteredProducts = allProducts.filter(
      p => p.category?.toLowerCase() === 'plus size' || 
           p.category?.name?.toLowerCase() === 'plus size'
    );
    collectionTitle = 'Plus Size Tees';
  } else if (slug === 'bestsellers') {
    filteredProducts = allProducts.filter(p => p.tags?.includes('BESTSELLER'));
    collectionTitle = 'Bestsellers';
  } else if (slug === 'new-drops') {
    filteredProducts = allProducts.filter(p => p.tags?.includes('NEW ARRIVAL'));
    collectionTitle = 'New Drops';
  }

  return (
    <div className="w-full space-y-0">
      <Suspense fallback={
        <div className="flex justify-center items-center py-20 text-xs font-bold uppercase tracking-widest text-stone-400">
          Loading collection...
        </div>
      }>
        <ShopClient 
          initialProducts={filteredProducts as any} 
          categories={finalCategories as any} 
          settings={settingsMap}
        />
      </Suspense>
    </div>
  );
}
