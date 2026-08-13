import { supabase, withTimeout } from '@/lib/supabase';
import HomeClientWrapper from './HomeClientWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const MOCK_PRODUCTS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Eternal Vision',
    slug: 'eternal-vision-black-tee',
    category: 'Limited Edition',
    price: 1299,
    mrp: 1299,
    discount_price: 1299,
    product_images: [
      { image_url: '/products/farebi-olive.jpg' },
      { image_url: '/products/polarize-navy.jpg' },
      { image_url: '/products/mard-paisa-maroon.jpg' },
      { image_url: '/products/polarize-cream.jpg' },
    ]
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Chaos Bloom',
    slug: 'chaos-bloom-ivory-tee',
    category: 'On Fire',
    price: 1199,
    mrp: 1199,
    discount_price: 1199,
    product_images: [
      { image_url: '/products/polarize-cream.jpg' },
      { image_url: '/products/farebi-olive.jpg' },
      { image_url: '/products/polarize-navy.jpg' },
      { image_url: '/products/mard-paisa-maroon.jpg' },
    ]
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Midnight Tales',
    slug: 'midnight-tales-black-tee',
    category: 'Graphic Tee',
    price: 1299,
    mrp: 1299,
    discount_price: 1299,
    product_images: [
      { image_url: '/products/polarize-navy.jpg' },
      { image_url: '/products/mard-paisa-maroon.jpg' },
      { image_url: '/products/farebi-olive.jpg' },
      { image_url: '/products/polarize-cream.jpg' },
    ]
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Lost Paradise',
    slug: 'lost-paradise-black-tee',
    category: 'Psychology Edition',
    price: 1299,
    mrp: 1299,
    discount_price: 1299,
    product_images: [
      { image_url: '/products/mard-paisa-maroon.jpg' },
      { image_url: '/products/polarize-cream.jpg' },
      { image_url: '/products/polarize-navy.jpg' },
      { image_url: '/products/farebi-olive.jpg' },
    ]
  }
];

export default async function HomePage() {
  let dbProducts: any[] = [];

  try {
    const res: any = await withTimeout(
      supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
    );

    const prods = res?.data;
    
    if (prods && prods.length > 0) {
      dbProducts = prods.map((prod: any, index: number) => {
        const fallbacks = [
          '/products/farebi-olive.jpg',
          '/products/polarize-cream.jpg',
          '/products/polarize-navy.jpg',
          '/products/mard-paisa-maroon.jpg'
        ];
        const rawImages = prod.product_images || [];
        const validImages = rawImages.length > 0
          ? rawImages
          : [{ image_url: fallbacks[index % fallbacks.length] }];

        return {
          ...prod,
          category: prod.category ? (prod.category as any).name : 'Oversized Tees',
          product_images: validImages,
          inventory: prod.inventory || []
        };
      });
    }
  } catch (err) {
    console.error('Error loading Supabase products:', err);
  }

  const displayProducts = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

  return (
    <HomeClientWrapper products={displayProducts} />
  );
}
