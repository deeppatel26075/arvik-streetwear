'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CategoryProductCard from '@/components/CategoryProductCard';
import PriceRangeSlider from '@/components/PriceRangeSlider';
import { useTheme } from '@/context/ThemeContext';
import PsychologyBackdrop from '@/components/PsychologyBackdrop';
import OnFireBackdrop from '@/components/OnFireBackdrop';
import { SlidersHorizontal, ArrowUpDown, ChevronDown, X, Check } from 'lucide-react';

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
  const { setThemePreset } = useTheme();

  const initialSearch = searchParams?.get('search') || '';
  const initialFilter = searchParams?.get('filter') || '';
  const initialCat = searchParams?.get('category') || '';

  const [localProducts, setLocalProducts] = useState<Product[]>(initialProducts);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [priceSort, setPriceSort] = useState<string>('');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const SORT_OPTIONS = [
    { value: '', label: 'Featured' },
    { value: 'low-high', label: 'Price: Low to High' },
    { value: 'high-low', label: 'Price: High to Low' },
  ];

  useEffect(() => {
    if (!sortOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sortOpen]);

  const priceBoundMax = useMemo(() => {
    const max = localProducts.reduce((m, p) => Math.max(m, p.discount_price || p.price), 0);
    return Math.max(500, Math.ceil(max / 500) * 500);
  }, [localProducts]);
  const effectivePriceMin = priceRange ? priceRange[0] : 0;
  const effectivePriceMax = priceRange ? priceRange[1] : priceBoundMax;

  // Sync state when URL search parameters change via Navbar links
  useEffect(() => {
    const cat = searchParams?.get('category') || '';
    const query = searchParams?.get('query') || searchParams?.get('search') || '';
    setSelectedCategory(cat);
    setSearchQuery(query);
  }, [searchParams]);

  const categorySlug = (() => {
    const target = selectedCategory.toLowerCase().trim();
    return target.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  })();
  const isPsychology = categorySlug === 'psychology-edition';
  const isOnFire = categorySlug === 'on-fire';

  // Selecting the Psychology Edition or On Fire category repaints the
  // whole tab — background, text, and accent colors — to match its vibe.
  useEffect(() => {
    if (isPsychology) setThemePreset('psychology');
    else if (isOnFire) setThemePreset('onfire');
    else setThemePreset('chaos');
    return () => setThemePreset('chaos');
  }, [isPsychology, isOnFire, setThemePreset]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('arviik_custom_products');
      const parsed = stored ? JSON.parse(stored) : [];

      // The cache is only trustworthy if it reflects the exact same set of
      // products the server just fetched from Supabase, with a shape the
      // filters can actually use — otherwise an old/corrupt snapshot (e.g.
      // saved before inventory rows existed) silently zeroes out every
      // filter without any visible error. When in doubt, prefer the fresh
      // server data over the cache.
      const freshIds = initialProducts.map((p) => p.id).sort().join(',');
      const cachedIds = Array.isArray(parsed) ? parsed.map((p: any) => p.id).sort().join(',') : '';
      const hasValidShape =
        Array.isArray(parsed) &&
        parsed.every((p: any) => typeof p.price === 'number' && Array.isArray(p.inventory));

      if (!stored || parsed.length === 0 || cachedIds !== freshIds || !hasValidShape) {
        localStorage.setItem('arviik_custom_products', JSON.stringify(initialProducts));
        setLocalProducts(initialProducts);
      } else {
        setLocalProducts(parsed.filter((p: any) => !p.is_hidden));
      }
    } catch (e) {
      console.error('Failed to load custom products in shop:', e);
      setLocalProducts(initialProducts);
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
        // No inventory data means we have no evidence this size exists for
        // the product — exclude it rather than assuming every size is in
        // stock, which was previously making e.g. "XXL" show as available
        // for products that never carried it.
        if (!p.inventory) return false;
        const sizeItem = p.inventory.find(
          (inv) => inv.size.toUpperCase() === selectedSize.toUpperCase()
        );
        return sizeItem && sizeItem.quantity > 0;
      });
    }

    if (priceRange) {
      filtered = filtered.filter((p) => {
        const effectivePrice = p.discount_price || p.price;
        return effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
      });
    }

    if (priceSort === 'low-high') {
      filtered.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
    } else if (priceSort === 'high-low') {
      filtered.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
    }

    setProducts(filtered);
  }, [searchQuery, selectedCategory, selectedSize, priceRange, priceSort, localProducts, initialFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSize('');
    setPriceRange(null);
    setPriceSort('');
    router.push('/shop');
  };

  const sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['S', 'M', 'L', 'XL'];

  // "Psychology Edition" is the real category name in the database (and
  // what filtering/theming key off of), but it's branded as "Hidden
  // Patterns" everywhere it's shown to shoppers.
  const categoryDisplayName = (name: string) =>
    name.toLowerCase() === 'psychology edition' ? 'Hidden Patterns' : name;

  // Per-option result counts — each category/size shows how many products
  // would match if it were picked, given every OTHER active filter (so
  // picking one always narrows toward a non-zero, honest number).
  const matchesSearchText = (p: Product) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return p.name.toLowerCase().includes(query) || (p.description?.toLowerCase().includes(query) ?? false);
  };
  const matchesPriceRange = (p: Product) => {
    if (!priceRange) return true;
    const effectivePrice = p.discount_price || p.price;
    return effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
  };
  const matchesCategoryName = (p: Product, categoryName: string) => {
    if (!categoryName) return true;
    const target = categoryName.toLowerCase().trim();
    const catName = typeof p.category === 'object' && p.category ? p.category.name : ((p.category as any) || '');
    const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const targetSlug = target.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return catName.toLowerCase() === target || catSlug === targetSlug;
  };
  const matchesSizeValue = (p: Product, size: string) => {
    if (!size) return true;
    // No inventory data means we have no evidence this size exists for the
    // product — exclude it rather than assuming every size is in stock.
    if (!p.inventory) return false;
    const sizeItem = p.inventory.find((inv) => inv.size.toUpperCase() === size.toUpperCase());
    return !!sizeItem && sizeItem.quantity > 0;
  };

  const allCategoryCount = useMemo(
    () => localProducts.filter((p) => matchesSearchText(p) && matchesSizeValue(p, selectedSize) && matchesPriceRange(p)).length,
    [localProducts, searchQuery, selectedSize, priceRange]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.id] = localProducts.filter(
        (p) => matchesSearchText(p) && matchesCategoryName(p, cat.name) && matchesSizeValue(p, selectedSize) && matchesPriceRange(p)
      ).length;
    });
    return counts;
  }, [localProducts, categories, searchQuery, selectedSize, priceRange]);

  return (
    <>
      <PsychologyBackdrop active={isPsychology} />
      <OnFireBackdrop active={isOnFire} />
      <div className="relative z-10 space-y-3 sm:space-y-12 pb-16 transition-colors duration-500">
      {/* 1. Hero Banner — re-themes automatically per category (On Fire,
          Psychology, default) via the CSS custom properties, and folds the
          title, live item count, and every control into one premium card
          instead of scattering them across separate bare rows. Compact
          padding on mobile so products appear higher on the first
          viewport — the mobile Filters/Sort trigger lives in its own
          sticky bar right below instead of inside this card. */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-lg">
        <div className="relative px-4 sm:px-10 py-4 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 sm:gap-7">
            <div className="space-y-1 sm:space-y-3">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[var(--color-text-secondary)]">
                Arviik Catalog
              </span>
              <h1 className="font-syne font-extrabold text-[22px] sm:text-4xl lg:text-5xl uppercase tracking-tight sm:tracking-wide text-[var(--color-text-primary)] leading-[1.02] sm:leading-[0.95] break-words">
                {selectedCategory ? categoryDisplayName(selectedCategory) : 'Streetwear Drops'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <span className="inline-flex items-center h-5 sm:h-6 px-2.5 sm:px-3 rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] text-[10px] font-bold uppercase tracking-wider">
                  {products.length} {products.length === 1 ? 'Item' : 'Items'}
                </span>
                {(selectedCategory || selectedSize || searchQuery || priceRange || priceSort) && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] underline underline-offset-4 hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile-only category chips — quick category switching right
              from the hero card, no need to open the filters drawer for it. */}
          <div className="lg:hidden flex gap-1.5 overflow-x-auto pt-3 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
              }`}
            >
              All <span className="opacity-60">({allCategoryCount})</span>
            </button>
            {categories.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {categoryDisplayName(cat.name)} <span className="opacity-60">({categoryCounts[cat.id] ?? 0})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Filters | Sort bar (mobile only) — sits in normal document
          flow right below the hero card's category chips, not pinned to
          the header, so it appears exactly where "Shop By Category"
          leaves off rather than floating above it. */}
      <div className="lg:hidden mt-3">
        <div
          ref={sortRef}
          className="z-20 grid grid-cols-2 divide-x divide-[var(--color-border)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-sm relative"
        >
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-colors rounded-l-xl"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="relative flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-colors rounded-r-xl"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort By
            <ChevronDown className={`h-3 w-3 text-[var(--color-text-secondary)] transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            {priceSort && (
              <span className="absolute top-2 right-3 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            )}
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-48 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
              {SORT_OPTIONS.map((opt) => {
                const active = opt.value === priceSort;
                return (
                  <button
                    key={opt.value || 'default'}
                    type="button"
                    onClick={() => {
                      setPriceSort(opt.value);
                      setSortOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors ${
                      active
                        ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Grid & Filters Column */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Filters (Desktop) — sticky so it stays in view
            while scrolling a long product list */}
        <div className="hidden lg:block">
          <div className="sticky top-24 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-5 space-y-7 shadow-sm">
            <h2 className="font-bold uppercase text-[var(--color-text-primary)] text-sm tracking-widest">
              Filters
            </h2>

            {searchQuery && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                <span className="truncate">Search: &quot;{searchQuery}&quot;</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="shrink-0 hover:text-[var(--color-text-primary)]"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Category Filter — pill chips */}
            <div className="space-y-2.5">
              <h3 className="font-bold uppercase text-[var(--color-text-primary)] text-[10px] tracking-widest border-b border-[var(--color-border)] pb-1.5">
                Categories
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    !selectedCategory
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  All <span className="opacity-60">({allCategoryCount})</span>
                </button>
                {categories.map((cat) => {
                  const active = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                        active
                          ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {categoryDisplayName(cat.name)} <span className="opacity-60">({categoryCounts[cat.id] ?? 0})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Filter — checkbox style */}
            <div className="space-y-2.5">
              <h3 className="font-bold uppercase text-[var(--color-text-primary)] text-[10px] tracking-widest border-b border-[var(--color-border)] pb-1.5">
                Size
              </h3>
              <div className="flex flex-col space-y-2">
                {sizes.map((size) => {
                  const checked = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(checked ? '' : size)}
                      className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-primary)] group"
                    >
                      <span className="tracking-wide">{size}</span>
                      <span
                        className={`h-4 w-4 rounded-sm border flex items-center justify-center transition-colors ${
                          checked
                            ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                            : 'border-[var(--color-border)] group-hover:border-[var(--color-accent)]'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <h3 className="font-bold uppercase text-[var(--color-text-primary)] text-[10px] tracking-widest border-b border-[var(--color-border)] pb-1.5">
                Price
              </h3>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  Selected Price Range
                </p>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  ₹{effectivePriceMin.toLocaleString('en-IN')} - ₹{effectivePriceMax.toLocaleString('en-IN')}
                </p>
              </div>
              <PriceRangeSlider
                min={0}
                max={priceBoundMax}
                valueMin={effectivePriceMin}
                valueMax={effectivePriceMax}
                onChange={(newMin, newMax) => setPriceRange([newMin, newMax])}
              />
            </div>

            {/* Clear Filters Button */}
            {(selectedCategory || selectedSize || searchQuery || priceRange || priceSort) && (
              <button
                onClick={clearFilters}
                className="w-full bg-transparent border border-[var(--color-border)] hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] text-[var(--color-text-primary)] text-[10px] font-bold uppercase tracking-widest py-3 rounded-[10px] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Products Grid */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-[var(--color-border)] rounded-[18px]">
              <p className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-widest">
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
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(220px,300px))] justify-start gap-2.5 sm:gap-6">
              {products.map((product) => (
                <CategoryProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Mobile Filters Drawer — rendered as a sibling of the z-10 content
          wrapper above (not nested inside it), since a fixed-position
          descendant's z-index is still capped by an ancestor's own
          stacking context. Nested here, z-[99999] would only out-rank
          siblings inside that wrapper, not the navbar's separate z-40
          stacking context, and the drawer's own header would render
          underneath the sticky navbar. */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[99999] lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
          />
          {/* Drawer Content */}
          <div className="relative ml-0 mr-auto w-[280px] h-full bg-[var(--color-bg)] shadow-2xl flex flex-col z-50 border-r border-[var(--color-border)] animate-slide-up">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--color-border)]">
              <span className="font-bold uppercase tracking-wider text-[var(--color-text-primary)] text-xs">
                Filters
              </span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto px-5 py-5 space-y-6">
              {searchQuery && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  <span className="truncate">Search: &quot;{searchQuery}&quot;</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="shrink-0 hover:text-[var(--color-text-primary)]"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {/* Category chips live inline on the hero card now, so this
                  drawer stays focused on Size + Price. */}
              {/* Size — checkbox style */}
              <div className="space-y-2.5">
                <h3 className="font-bold uppercase text-[var(--color-text-primary)] text-[10px] tracking-widest border-b border-[var(--color-border)] pb-1.5">
                  Size
                </h3>
                <div className="flex flex-col space-y-2">
                  {sizes.map((size) => {
                    const checked = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(checked ? '' : size)}
                        className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-primary)] group"
                      >
                        <span className="tracking-wide">{size}</span>
                        <span
                          className={`h-4 w-4 rounded-sm border flex items-center justify-center transition-colors ${
                            checked
                              ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                              : 'border-[var(--color-border)] group-hover:border-[var(--color-accent)]'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-3">
                <h3 className="font-bold uppercase text-[var(--color-text-primary)] text-[10px] tracking-widest border-b border-[var(--color-border)] pb-1.5">
                  Price
                </h3>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                    Selected Price Range
                  </p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    ₹{effectivePriceMin.toLocaleString('en-IN')} - ₹{effectivePriceMax.toLocaleString('en-IN')}
                  </p>
                </div>
                <PriceRangeSlider
                  min={0}
                  max={priceBoundMax}
                  valueMin={effectivePriceMin}
                  valueMax={effectivePriceMax}
                  onChange={(newMin, newMax) => setPriceRange([newMin, newMax])}
                />
              </div>
            </div>

            {/* Footer — pinned to the bottom of the drawer instead of
                floating right under Price with dead space beneath it. */}
            <div className="border-t border-[var(--color-border)] px-5 py-4 space-y-2.5">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-[var(--color-accent)] text-[var(--color-on-accent)] text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                View {products.length} {products.length === 1 ? 'Item' : 'Items'}
              </button>
              {(selectedCategory || selectedSize || searchQuery || priceRange || priceSort) && (
                <button
                  onClick={() => {
                    clearFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-1"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
