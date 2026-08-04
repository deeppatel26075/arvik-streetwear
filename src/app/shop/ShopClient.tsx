'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { SlidersHorizontal, ArrowUpDown, X, Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  image_url: string;
}

interface InventoryItem {
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discount_price?: number;
  category?: { name: string };
  product_images?: ProductImage[];
  inventory?: InventoryItem[];
  is_featured?: boolean;
}

interface ShopClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function ShopClient({ initialProducts, categories }: ShopClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSearch = searchParams?.get('search') || '';
  const initialFilter = searchParams?.get('filter') || '';
  const initialCat = searchParams?.get('category') || '';

  const [localProducts, setLocalProducts] = useState<Product[]>(initialProducts);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [priceSort, setPriceSort] = useState<string>('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state when URL search parameters change via Navbar links
  useEffect(() => {
    const cat = searchParams?.get('category') || '';
    const query = searchParams?.get('query') || searchParams?.get('search') || '';
    setSelectedCategory(cat);
    setSearchQuery(query);
  }, [searchParams]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('arviik_custom_products');
      let parsed = stored ? JSON.parse(stored) : [];
      
      const hasStaleImages = parsed.some((p: any) => 
        p.product_images?.some((img: any) => 
          img.image_url.includes('eternal-vision') || 
          img.image_url.includes('midnight-tales') || 
          img.image_url.includes('chaos-bloom') || 
          img.image_url.includes('lost-paradise')
        )
      );

      if (!stored || hasStaleImages || parsed.length === 0) {
        localStorage.setItem('arviik_custom_products', JSON.stringify(initialProducts));
        setLocalProducts(initialProducts);
      } else {
        setLocalProducts(parsed.filter((p: any) => !p.is_hidden));
      }
    } catch (e) {
      console.error('Failed to load custom products in shop:', e);
    }
  }, [initialProducts]);

  useEffect(() => {
    let filtered = [...localProducts];
    const filterParam = searchParams?.get('filter') || '';
    const priceParam = searchParams?.get('price') || '';

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    if (filterParam === 'featured') {
      filtered = filtered.filter((p) => p.is_featured);
    } else if (filterParam === 'bestseller') {
      filtered = filtered.filter((p) => p.is_featured || (p.discount_price && p.discount_price < 1300));
    }

    if (priceParam === 'under999') {
      filtered = filtered.filter((p) => (p.discount_price || p.price) <= 999);
    }

    if (selectedCategory) {
      const target = selectedCategory.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const catName = typeof p.category === 'object' && p.category ? p.category.name : (p.category || '');
        const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const targetSlug = target.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return catName.toLowerCase() === target || catSlug === targetSlug;
      });
    }

    if (selectedSize) {
      filtered = filtered.filter((p) => {
        if (!p.inventory) return true;
        const sizeItem = p.inventory.find(
          (inv) => inv.size.toUpperCase() === selectedSize.toUpperCase()
        );
        return sizeItem && sizeItem.quantity > 0;
      });
    }

    if (priceSort === 'low-high') {
      filtered.sort((a, b) => {
        const priceA = a.discount_price || a.price;
        const priceB = b.discount_price || b.price;
        return priceA - priceB;
      });
    } else if (priceSort === 'high-low') {
      filtered.sort((a, b) => {
        const priceA = a.discount_price || a.price;
        const priceB = b.discount_price || b.price;
        return priceB - priceA;
      });
    }

    setProducts(filtered);
  }, [searchQuery, selectedCategory, selectedSize, priceSort, localProducts, initialFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSize('');
    setPriceSort('');
    router.push('/shop');
  };

  const sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Header Banner */}
      <div className="border-b border-[#ECECEC] pb-5">
        <span className="text-[9px] text-[#666666] font-bold tracking-widest uppercase">
          ARVIIK Catalog
        </span>
        <h1 className="font-bold text-2xl uppercase tracking-wider text-[#111111] mt-0.5">
          Streetwear Drops
        </h1>
      </div>

      {/* 2. Controls / Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECECEC] pb-5">
        {/* Search */}
        <div className="relative w-full md:max-w-sm">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="apple-input w-full pl-10 text-xs"
          />
          <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-[#666666]" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-[#666666] hover:text-[#111111]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Desktop Sorting & Filter buttons */}
        <div className="flex items-center space-x-4 justify-between md:justify-end">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center space-x-1.5 border border-[#ECECEC] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#111111] hover:bg-[#F7F7F7] rounded-[10px]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center space-x-2">
            <ArrowUpDown className="h-4 w-4 text-[#666666]" />
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="bg-[#F7F7F7] border border-[#ECECEC] text-xs font-bold px-3 py-2.5 focus:outline-none focus:border-[#111111] rounded-[10px]"
            >
              <option value="">Sort Price</option>
              <option value="low-high">Low to High</option>
              <option value="high-low">High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Grid & Filters Column */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Filters (Desktop) */}
        <div className="hidden lg:block space-y-6">
          {/* Category Filter */}
          <div className="space-y-2.5">
            <h3 className="font-bold uppercase text-[#111111] text-[10px] tracking-widest border-b border-[#ECECEC] pb-1.5">
              Categories
            </h3>
            <div className="flex flex-col space-y-1.5 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`text-left py-1 hover:text-[#111111] transition-colors uppercase tracking-wider font-semibold ${
                  !selectedCategory ? 'text-[#111111] font-bold' : 'text-[#666666]'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`text-left py-1 hover:text-[#111111] transition-colors uppercase tracking-wider font-semibold ${
                    selectedCategory.toLowerCase() === cat.name.toLowerCase()
                      ? 'text-[#111111] font-bold'
                      : 'text-[#666666]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="space-y-2.5">
            <h3 className="font-bold uppercase text-[#111111] text-[10px] tracking-widest border-b border-[#ECECEC] pb-1.5">
              Sizes
            </h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                  className={`border font-bold text-xs w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors uppercase ${
                    selectedSize === size
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'border-[#ECECEC] text-[#111111] hover:border-[#111111]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory || selectedSize || searchQuery || priceSort) && (
            <button
              onClick={clearFilters}
              className="w-full bg-[#F7F7F7] border border-[#ECECEC] hover:bg-[#111111] hover:text-white text-[#111111] text-[10px] font-bold uppercase tracking-widest py-3 rounded-[10px] transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Column: Products Grid */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-[#ECECEC] rounded-[18px]">
              <p className="text-[#666666] text-xs font-bold uppercase tracking-widest">
                No items match your criteria
              </p>
              <button
                onClick={clearFilters}
                className="apple-button text-xs px-6 py-2.5 hover:opacity-90 transition-opacity"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
          />
          {/* Drawer Content */}
          <div className="relative ml-0 mr-auto w-[280px] h-full bg-white shadow-2xl flex flex-col z-50 border-r border-[#ECECEC] animate-slide-up">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#ECECEC]">
              <span className="font-bold uppercase tracking-wider text-[#111111] text-xs">
                Filters
              </span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[#666666] hover:text-[#111111]"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto px-5 py-5 space-y-6">
              {/* Categories */}
              <div className="space-y-2.5">
                <h3 className="font-bold uppercase text-[#111111] text-[10px] tracking-widest border-b border-[#ECECEC] pb-1.5">
                  Categories
                </h3>
                <div className="flex flex-col space-y-1.5 text-xs">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setMobileFiltersOpen(false);
                    }}
                    className={`text-left py-1 uppercase tracking-wider font-semibold ${
                      !selectedCategory ? 'text-[#111111] font-bold' : 'text-[#666666]'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setMobileFiltersOpen(false);
                      }}
                      className={`text-left py-1 uppercase tracking-wider font-semibold ${
                        selectedCategory.toLowerCase() === cat.name.toLowerCase()
                          ? 'text-[#111111] font-bold'
                          : 'text-[#666666]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-2.5">
                <h3 className="font-bold uppercase text-[#111111] text-[10px] tracking-widest border-b border-[#ECECEC] pb-1.5">
                  Sizes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                      className={`border font-bold text-xs w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors uppercase ${
                        selectedSize === size
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'border-[#ECECEC] text-[#111111]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {(selectedCategory || selectedSize || searchQuery || priceSort) && (
                <button
                  onClick={() => {
                    clearFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full bg-[#F7F7F7] border border-[#ECECEC] text-[#111111] text-[10px] font-bold uppercase tracking-widest py-3 rounded-[10px]"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
