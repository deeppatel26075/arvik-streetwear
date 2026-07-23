import { supabase } from '@/lib/supabase';
import { MOCK_PRODUCTS } from '../../page';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { SlidersHorizontal, Grid } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  let dbProducts: any[] = [];
  let categoryName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  try {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', slug)
      .single();

    if (categoryData) {
      categoryName = categoryData.name;
      
      const { data: prods } = await supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('category_id', categoryData.id)
        .eq('is_hidden', false);

      if (prods) {
        dbProducts = prods.map((p) => ({
          ...p,
          category: p.category ? { name: (p.category as any).name } : undefined,
          product_images: p.product_images || [],
          inventory: p.inventory || []
        }));
      }
    }
  } catch (err) {
    console.error(`Failed to load category products for ${slug}:`, err);
  }

  // Fallback products mapping the category slugs
  const finalProducts = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS.filter((p: any) => {
    const catStr = typeof p.category === 'object' && p.category ? p.category.name : (p.category || '');
    const catSlug = catStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return catSlug === slug || catStr.toLowerCase() === slug.replace(/-/g, ' ');
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-bold text-lg uppercase tracking-widest text-[#111111]">
          {categoryName.toUpperCase()}
        </h1>
        <p className="text-[10px] text-[#666666] font-bold uppercase tracking-wider">
          Showing 1-{finalProducts.length} of {finalProducts.length} results
        </p>
      </div>

      {/* Control filter bar */}
      <div className="flex justify-between items-center border-b border-[#ECECEC] pb-3 text-xs font-bold uppercase tracking-widest text-[#111111]">
        <button className="flex items-center space-x-1.5 hover:opacity-75">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
        <button className="flex items-center space-x-1.5 hover:opacity-75">
          <Grid className="h-3.5 w-3.5" />
          <span>Grid</span>
        </button>
      </div>

      {/* Grid */}
      {finalProducts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#ECECEC] rounded-[18px]">
          <p className="text-[#666666] text-xs font-bold uppercase tracking-widest">
            No products found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {finalProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
