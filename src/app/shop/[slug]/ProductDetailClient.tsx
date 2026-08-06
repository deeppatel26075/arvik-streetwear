'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, WishlistItem } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import RecentlyViewed from '@/components/RecentlyViewed';
import {
  Heart,
  ShoppingBag,
  Star,
  ArrowLeft,
  Truck,
  RotateCcw,
  ShieldCheck,
  Ruler,
  ZoomIn,
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Check,
  Zap,
  Calculator,
} from 'lucide-react';

interface ProductImage {
  image_url: string;
}

interface InventoryItem {
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discount_price?: number;
    fabric?: string;
    gsm?: string;
    fit_type?: string;
    wash_instructions?: string;
    description?: string;
    category?: { name: string };
    product_images?: ProductImage[];
    inventory?: InventoryItem[];
  };
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('M');
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSmartCalculator, setShowSmartCalculator] = useState(false);
  const [userHeight, setUserHeight] = useState('175');
  const [userWeight, setUserWeight] = useState('70');
  const [fitPreference, setFitPreference] = useState<'oversized' | 'regular'>('oversized');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Accordion states
  const [openAccordion, setOpenAccordion] = useState<'description' | 'specs' | 'wash' | 'shipping' | null>('specs');

  const images = product.product_images && product.product_images.length > 0
    ? product.product_images
    : [{ image_url: '/placeholder-tee.jpg' }];

  const primaryImage = images[activeImageIdx]?.image_url || images[0]?.image_url || '/placeholder-tee.jpg';

  const activePrice = product.discount_price && product.discount_price > 0
    ? product.discount_price
    : product.price;

  useEffect(() => {
    try {
      const currentItem = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: activePrice,
        image: images[0]?.image_url || '/placeholder-tee.jpg',
      };

      const stored = localStorage.getItem('arviik_recently_viewed');
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter((i: any) => i.id !== product.id);
      list.unshift(currentItem);
      localStorage.setItem('arviik_recently_viewed', JSON.stringify(list.slice(0, 8)));
    } catch (e) {
      console.error('Failed saving to recently viewed:', e);
    }
  }, [product.id, activePrice, images]);

  const calculateSize = () => {
    const w = parseFloat(userWeight) || 68;
    let recommendedSize: 'S' | 'M' | 'L' | 'XL' | 'XXL' = 'M';
    if (w < 58) recommendedSize = 'S';
    else if (w >= 58 && w < 72) recommendedSize = 'M';
    else if (w >= 72 && w < 84) recommendedSize = 'L';
    else if (w >= 84 && w < 96) recommendedSize = 'XL';
    else recommendedSize = 'XXL';

    if (fitPreference === 'regular' && recommendedSize !== 'S') {
      const map: any = { M: 'S', L: 'M', XL: 'L', XXL: 'XL' };
      recommendedSize = map[recommendedSize] || recommendedSize;
    }

    setCalcResult(recommendedSize);
    setSelectedSize(recommendedSize);
  };

  const isDiscounted = product.discount_price !== undefined && product.discount_price !== null && product.discount_price > 0;
  const isFavorited = isInWishlist(product.id);

  const sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['S', 'M', 'L', 'XL', 'XXL'];

  const getStock = (size: 'S' | 'M' | 'L' | 'XL' | 'XXL') => {
    if (!product.inventory || product.inventory.length === 0) return 10;
    const item = product.inventory.find(i => i.size === size);
    return item ? item.quantity : 0;
  };

  const selectedStock = selectedSize ? getStock(selectedSize) : 10;

  const handleWishlistClick = () => {
    const wishItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discount_price,
      image: images[0]?.image_url || '/placeholder-tee.jpg',
      slug: product.slug,
    };
    toggleWishlist(wishItem);
  };

  const handleAddToCart = (redirectToCheck = false) => {
    if (!selectedSize) {
      setSizeWarning(true);
      return;
    }
    setSizeWarning(false);
    setAdding(true);

    const stockLimit = getStock(selectedSize);

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discount_price,
      image: images[0]?.image_url || '/placeholder-tee.jpg',
      slug: product.slug,
      size: selectedSize,
      quantity,
      maxStock: stockLimit || 10,
    });

    setTimeout(() => {
      setAdding(false);
      if (redirectToCheck) {
        router.push('/checkout');
      } else {
        const event = new CustomEvent('open-cart');
        window.dispatchEvent(event);
      }
    }, 300);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleTab = (tab: 'description' | 'specs' | 'wash' | 'shipping') => {
    setOpenAccordion(openAccordion === tab ? null : tab);
  };

  return (
    <div className="space-y-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex justify-between items-center pb-4 border-b border-stone-200">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-xs font-bold text-stone-600 hover:text-stone-950 uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Shop</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-1.5 text-xs text-stone-500 hover:text-stone-950 font-bold uppercase tracking-wider transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Product Layout (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* Left Column: Image Gallery Sticky Showcase */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
          {/* Main Display Image */}
          <div className="relative aspect-3/4 bg-stone-100 rounded-sm overflow-hidden border border-stone-200 group shadow-xs">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {isDiscounted && (
                <span className="bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-xs shadow-xs">
                  {Math.round(((product.price - activePrice) / product.price) * 100)}% OFF
                </span>
              )}
              {product.category?.name && (
                <span className="bg-stone-950/90 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-xs shadow-xs">
                  {product.category.name}
                </span>
              )}
            </div>

            {/* Actions over main image */}
            <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
              <button
                onClick={handleWishlistClick}
                className="p-3 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 shadow-md hover:bg-white transition-all border border-stone-200"
                title="Save to Wishlist"
              >
                <Heart
                  className={`h-4.5 w-4.5 transition-colors ${
                    isFavorited ? 'fill-red-600 text-red-600' : 'text-stone-700'
                  }`}
                />
              </button>
              <button
                onClick={() => setShowZoomModal(true)}
                className="p-3 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 shadow-md hover:bg-white transition-all border border-stone-200"
                title="Zoom Photo"
              >
                <ZoomIn className="h-4.5 w-4.5 text-stone-700" />
              </button>
            </div>
          </div>

          {/* Horizontal / Grid Thumbnails Strip */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`relative aspect-3/4 bg-stone-100 border rounded-xs overflow-hidden transition-all ${
                    activeImageIdx === i
                      ? 'border-stone-950 ring-2 ring-stone-950 shadow-sm'
                      : 'border-stone-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={`${product.name} look ${i + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Header & Title */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 block">
              ARVIIK STREETWEAR • {product.category?.name || 'LIMITED EDITION'}
            </span>
            <h1 className="font-syne font-extrabold text-2xl lg:text-3xl uppercase tracking-wider text-stone-950 leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars */}
            <div className="flex items-center space-x-2 pt-1">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-stone-900">4.9</span>
              <span className="text-xs text-stone-400">• 148 Verified Buyer Reviews</span>
            </div>
          </div>

          {/* Price Block */}
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xs flex items-center justify-between">
            <div>
              <span className="text-2xl font-extrabold text-stone-950 font-mono">
                {formatPrice(activePrice)}
              </span>
              {isDiscounted && (
                <span className="text-sm text-stone-400 line-through font-mono ml-3">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xs border border-emerald-200">
              In Stock & Ready to Ship
            </span>
          </div>

          {/* Key Product Attribute Badges */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-white border border-stone-200 rounded-xs space-y-0.5">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Fabric Blend</span>
              <span className="font-bold text-stone-900 uppercase tracking-wide">{product.fabric || '100% Premium Cotton'}</span>
            </div>
            <div className="p-3 bg-white border border-stone-200 rounded-xs space-y-0.5">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Fabric Weight</span>
              <span className="font-bold text-stone-900 uppercase tracking-wide">{product.gsm || '240 GSM Heavyweight'}</span>
            </div>
            <div className="p-3 bg-white border border-stone-200 rounded-xs space-y-0.5">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Silhouette Fit</span>
              <span className="font-bold text-stone-900 uppercase tracking-wide">{product.fit_type || 'Oversized Boxy Fit'}</span>
            </div>
            <div className="p-3 bg-white border border-stone-200 rounded-xs space-y-0.5">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Print Craft</span>
              <span className="font-bold text-stone-900 uppercase tracking-wide">High-Density Screen Print</span>
            </div>
          </div>

          {/* Size Selector Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Select Size:</span>
                <span className="text-stone-950 font-extrabold">{selectedSize || 'Choose Size'}</span>
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSmartCalculator(true)}
                  className="inline-flex items-center space-x-1 text-xs text-lime-700 hover:text-stone-950 font-extrabold uppercase tracking-wider underline underline-offset-4"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  <span>Find My Size</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="inline-flex items-center space-x-1 text-xs text-stone-600 hover:text-stone-950 font-bold uppercase tracking-wider underline underline-offset-4"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {sizes.map((sz) => {
                const stock = getStock(sz);
                const isAvailable = stock > 0;
                return (
                  <button
                    key={sz}
                    disabled={!isAvailable}
                    onClick={() => {
                      setSelectedSize(sz);
                      setSizeWarning(false);
                    }}
                    className={`h-12 font-bold text-xs rounded-xs flex flex-col items-center justify-center transition-all uppercase border ${
                      selectedSize === sz
                        ? 'bg-stone-950 text-white border-stone-950 shadow-md ring-2 ring-stone-950'
                        : !isAvailable
                        ? 'border-stone-150 text-stone-300 bg-stone-50 cursor-not-allowed line-through'
                        : 'border-stone-200 text-stone-900 hover:border-stone-950 hover:bg-stone-50'
                    }`}
                  >
                    <span>{sz}</span>
                    {isAvailable && stock <= 3 && (
                      <span className={`text-[8px] tracking-tighter uppercase font-bold ${selectedSize === sz ? 'text-amber-300' : 'text-amber-600'}`}>
                        {stock} Left
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {sizeWarning && (
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider animate-bounce">
                ⚠️ Please select a size before adding to cart.
              </p>
            )}

            {selectedSize && selectedStock <= 3 && selectedStock > 0 && (
              <p className="text-[11px] font-bold text-amber-800 bg-amber-50 p-2.5 rounded-xs border border-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Hurry! Only {selectedStock} item(s) left in Size {selectedSize}.</span>
              </p>
            )}
          </div>

          {/* Action CTA Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleAddToCart(false)}
              disabled={adding}
              className="w-full bg-stone-950 hover:bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest py-4 rounded-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>{adding ? 'Adding To Bag...' : 'ADD TO CART'}</span>
            </button>

            <button
              onClick={() => handleAddToCart(true)}
              disabled={adding}
              className="w-full bg-white border-2 border-stone-950 text-stone-950 hover:bg-stone-950 hover:text-white text-xs font-extrabold uppercase tracking-widest py-3.5 rounded-xs transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              <span>BUY IT NOW (EXPRESS CHECKOUT)</span>
            </button>
          </div>

          {/* Delivery & Assurance Perks Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 border border-stone-200/80 rounded-xs text-center">
            <div className="space-y-1">
              <Truck className="h-4 w-4 text-stone-800 mx-auto" />
              <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider block">Free Shipping</span>
              <span className="text-[9px] text-stone-500 block">Pan-India Orders</span>
            </div>
            <div className="space-y-1 border-x border-stone-200 px-1">
              <RotateCcw className="h-4 w-4 text-stone-800 mx-auto" />
              <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider block">Easy Returns</span>
              <span className="text-[9px] text-stone-500 block">7-Day Exchange</span>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="h-4 w-4 text-stone-800 mx-auto" />
              <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider block">100% Authentic</span>
              <span className="text-[9px] text-stone-500 block">Razorpay Verified</span>
            </div>
          </div>

          {/* Product Details Accordion Tabs */}
          <div className="border-t border-stone-200 pt-4 space-y-2">
            


            {/* Specs Tab */}
            <div className="border border-stone-200 rounded-xs overflow-hidden">
              <button
                onClick={() => toggleTab('specs')}
                className="w-full p-3.5 bg-white hover:bg-stone-50 flex justify-between items-center text-xs font-bold text-stone-900 uppercase tracking-wider"
              >
                <span>Fabric & Fit Specifications</span>
                {openAccordion === 'specs' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {openAccordion === 'specs' && (
                <div className="p-4 bg-stone-50/50 border-t border-stone-100 text-xs space-y-2 text-stone-700">
                  <p><strong className="font-semibold text-stone-900">Material:</strong> {product.fabric || '100% Premium French Terry Cotton'}</p>
                  <p><strong className="font-semibold text-stone-900">Fabric Weight:</strong> {product.gsm || '240 GSM Heavyweight'}</p>
                  <p><strong className="font-semibold text-stone-900">Fit Silhouette:</strong> {product.fit_type || 'Signature Oversized Drop-Shoulder Fit'}</p>
                  <p><strong className="font-semibold text-stone-900">Finish:</strong> Bio-washed, Pre-shrunk & Softened</p>
                </div>
              )}
            </div>

            {/* Wash Care Tab */}
            <div className="border border-stone-200 rounded-xs overflow-hidden">
              <button
                onClick={() => toggleTab('wash')}
                className="w-full p-3.5 bg-white hover:bg-stone-50 flex justify-between items-center text-xs font-bold text-stone-900 uppercase tracking-wider"
              >
                <span>Wash & Care Instructions</span>
                {openAccordion === 'wash' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {openAccordion === 'wash' && (
                <div className="p-4 bg-stone-50/50 border-t border-stone-100 text-xs space-y-1.5 text-stone-700">
                  <p>• {product.wash_instructions || 'Machine wash cold inside out with like colors.'}</p>
                  <p>• Do not iron directly on screen-printed graphic art.</p>
                  <p>• Do not tumble dry high; hang dry in shade to maintain fabric longevity.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Customer Reviews & Ratings Section */}
      <div className="pt-12 border-t border-stone-200 space-y-6">
        <div className="flex justify-between items-end border-b border-stone-200 pb-4">
          <div>
            <h3 className="font-syne font-extrabold text-xl uppercase tracking-wider text-stone-900">
              Customer Reviews & Ratings
            </h3>
            <p className="text-xs text-stone-500 font-light mt-0.5">Verified feedback from street culture enthusiasts across India.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-extrabold text-stone-950 font-mono">4.9</span>
            <div className="text-amber-500 flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>
        </div>

        {/* 4 Feature Highlights Section (Image on Top + Title + Description) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {/* Element 1 */}
          <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden p-4 shadow-xs flex flex-col space-y-3 transition-all hover:shadow-md">
            <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-stone-100">
              <Image
                src={imageList[0] || '/products/farebi-olive.jpg'}
                alt="240 GSM Heavyweight Cotton"
                fill
                className="object-cover"
              />
            </div>
            <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-900 text-center">
              240 GSM Heavyweight Cotton
            </h4>
            <p className="text-[11px] text-stone-600 leading-relaxed text-center font-medium">
              Engineered with 100% premium French Terry cotton for maximum structure, comfort, and long-lasting durability.
            </p>
          </div>

          {/* Element 2 */}
          <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden p-4 shadow-xs flex flex-col space-y-3 transition-all hover:shadow-md">
            <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-stone-100">
              <Image
                src={imageList[1] || '/products/polarize-cream.jpg'}
                alt="Signature Boxy Oversized Fit"
                fill
                className="object-cover"
              />
            </div>
            <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-900 text-center">
              Signature Boxy Oversized Fit
            </h4>
            <p className="text-[11px] text-stone-600 leading-relaxed text-center font-medium">
              Designed with dropped shoulders and relaxed boxy proportions for an authentic modern streetwear fit.
            </p>
          </div>

          {/* Element 3 */}
          <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden p-4 shadow-xs flex flex-col space-y-3 transition-all hover:shadow-md">
            <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-stone-100">
              <Image
                src={imageList[2] || '/products/polarize-navy.jpg'}
                alt="High-Density Screen Prints"
                fill
                className="object-cover"
              />
            </div>
            <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-900 text-center">
              High-Density Screen Prints
            </h4>
            <p className="text-[11px] text-stone-600 leading-relaxed text-center font-medium">
              High-definition graphic artwork printed using premium fade-resistant inks built to withstand intense wear.
            </p>
          </div>

          {/* Element 4 */}
          <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden p-4 shadow-xs flex flex-col space-y-3 transition-all hover:shadow-md">
            <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-stone-100">
              <Image
                src={imageList[3] || '/products/mard-paisa-maroon.jpg'}
                alt="Pan-India Express Delivery"
                fill
                className="object-cover"
              />
            </div>
            <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-900 text-center">
              Pan-India Express Delivery
            </h4>
            <p className="text-[11px] text-stone-600 leading-relaxed text-center font-medium">
              Fast shipping dispatched within 24 hours with express delivery and easy 7-day exchanges across India.
            </p>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {showZoomModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 border border-stone-800 rounded-sm overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 z-50 bg-stone-800 text-white p-2 rounded-full hover:bg-stone-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative w-full h-[80vh]">
              <Image
                src={primaryImage}
                alt="Zoomed product preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-xs max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-syne font-extrabold text-sm uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                <span>ARVIIK Size Measurement Guide</span>
              </h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="text-stone-400 hover:text-stone-900 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              All ARVIIK streetwear products are tailored in a signature oversized boxy fit. Order your normal size for an oversized look, or size down for a standard regular fit.
            </p>

            <table className="w-full text-left text-xs border border-stone-200">
              <thead>
                <tr className="bg-stone-100 text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-2.5 border-b border-r border-stone-200">Size</th>
                  <th className="p-2.5 border-b border-r border-stone-200">Chest (Inches)</th>
                  <th className="p-2.5 border-b border-r border-stone-200">Length (Inches)</th>
                  <th className="p-2.5 border-b border-stone-200">Shoulder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium text-stone-700">
                <tr><td className="p-2.5 border-r font-bold text-stone-900">S</td><td className="p-2.5 border-r">42"</td><td className="p-2.5 border-r">28"</td><td className="p-2.5">21"</td></tr>
                <tr><td className="p-2.5 border-r font-bold text-stone-900">M</td><td className="p-2.5 border-r">44"</td><td className="p-2.5 border-r">29"</td><td className="p-2.5">22"</td></tr>
                <tr><td className="p-2.5 border-r font-bold text-stone-900">L</td><td className="p-2.5 border-r">46"</td><td className="p-2.5 border-r">30"</td><td className="p-2.5">23"</td></tr>
                <tr><td className="p-2.5 border-r font-bold text-stone-900">XL</td><td className="p-2.5 border-r">48"</td><td className="p-2.5 border-r">31"</td><td className="p-2.5">24"</td></tr>
                <tr><td className="p-2.5 border-r font-bold text-stone-900">XXL</td><td className="p-2.5 border-r">50"</td><td className="p-2.5 border-r">32"</td><td className="p-2.5">25"</td></tr>
              </tbody>
            </table>

            <button
              onClick={() => setShowSizeGuide(false)}
              className="w-full bg-stone-950 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xs"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Smart Size Calculator Modal */}
      {showSmartCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs select-none">
          <div className="bg-white border border-stone-200 w-full max-w-md p-6 rounded-xs shadow-2xl relative space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-stone-950" />
                <h3 className="font-syne font-bold text-sm uppercase tracking-wider text-stone-900">
                  Smart Size Recommender
                </h3>
              </div>
              <button
                onClick={() => setShowSmartCalculator(false)}
                className="text-stone-400 hover:text-stone-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 font-medium">
              Enter your weight & height to calculate your ideal ARVIIK streetwear fit.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-600 block">Height (cm)</label>
                  <input
                    type="number"
                    value={userHeight}
                    onChange={(e) => setUserHeight(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 p-2.5 text-xs text-stone-900 focus:outline-none rounded-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-600 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={userWeight}
                    onChange={(e) => setUserWeight(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 p-2.5 text-xs text-stone-900 focus:outline-none rounded-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-600 block">Fit Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFitPreference('oversized')}
                    className={`p-2 text-xs font-bold uppercase rounded-xs border ${
                      fitPreference === 'oversized' ? 'bg-stone-950 text-white border-stone-950' : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    Oversized Boxy
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitPreference('regular')}
                    className={`p-2 text-xs font-bold uppercase rounded-xs border ${
                      fitPreference === 'regular' ? 'bg-stone-950 text-white border-stone-950' : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    Standard Regular
                  </button>
                </div>
              </div>

              <button
                onClick={calculateSize}
                className="w-full bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-xs uppercase tracking-widest py-3 rounded-xs transition-all"
              >
                Calculate My Size
              </button>

              {calcResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs text-center space-y-1 animate-fade-in">
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest block">Recommended Fit</span>
                  <span className="text-xl font-syne font-extrabold text-emerald-950">SIZE {calcResult}</span>
                  <p className="text-[10px] text-emerald-700">Size {calcResult} has been automatically selected for you!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Purchase Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md p-3 border-t border-stone-200/90 shadow-2xl flex items-center justify-between gap-3 select-none">
        <div className="flex flex-col">
          <span className="text-xs font-mono font-extrabold text-stone-950">{formatPrice(activePrice)}</span>
          <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Free Shipping</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value as any)}
            className="bg-stone-100 border border-stone-300 text-stone-900 font-extrabold text-xs px-2.5 py-2.5 rounded-xs focus:outline-none"
          >
            <option value="">Size</option>
            {sizes.map(sz => (
              <option key={sz} value={sz}>{sz}</option>
            ))}
          </select>
          <button
            onClick={() => handleAddToCart(false)}
            disabled={adding}
            className="bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xs flex items-center gap-1.5 shadow-md"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{adding ? 'Adding...' : 'Add to Bag'}</span>
          </button>
        </div>
      </div>

      {/* Recently Viewed Strip */}
      <div className="pt-10">
        <RecentlyViewed />
      </div>

    </div>
  );
}
