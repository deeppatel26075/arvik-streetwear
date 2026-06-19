import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import HomeClientWrapper from './HomeClientWrapper';

export const dynamic = 'force-dynamic';

// Define the mock products to display if Supabase fails or doesn't have data yet
export const MOCK_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'FAREBI OVERSIZED OLIVE TEE',
    slug: 'farebi-oversized-olive-tee',
    price: 1499,
    discount_price: 1299,
    fabric: '100% Premium French Terry Cotton',
    gsm: '240 GSM Heavyweight',
    fit_type: 'Oversized Boxy Fit',
    description: 'Heavyweight oversized drop shoulder Dark Olive T-shirt featuring a high-density "FAREBI" print on the chest and an artistic graphic illustration on the back. Designed for ultimate premium comfort.',
    category: { name: 'Graphic Prints' },
    product_images: [
      { image_url: '/products/farebi-olive.jpg' },
      { image_url: '/products/farebi-olive.jpg' }
    ],
    inventory: [
      { size: 'S', quantity: 12 },
      { size: 'M', quantity: 18 },
      { size: 'L', quantity: 24 },
      { size: 'XL', quantity: 10 },
      { size: 'XXL', quantity: 5 }
    ]
  },
  {
    id: 'prod-002',
    name: 'POLARIZE VINTAGE CREAM TEE',
    slug: 'polarize-vintage-cream-tee',
    price: 1299,
    discount_price: 999,
    fabric: '100% Ring-spun Premium Cotton',
    gsm: '240 GSM Heavyweight',
    fit_type: 'Oversized Boxy Fit',
    description: 'A clean and minimalist approach. Front "POLARIZE" logo block with detailed wings-design graphic art back print on a Vintage Cream silhouette. Perfect streetwear piece.',
    category: { name: 'Graphic Prints' },
    product_images: [
      { image_url: '/products/polarize-cream.jpg' },
      { image_url: '/products/polarize-cream.jpg' }
    ],
    inventory: [
      { size: 'S', quantity: 8 },
      { size: 'M', quantity: 15 },
      { size: 'L', quantity: 20 },
      { size: 'XL', quantity: 12 },
      { size: 'XXL', quantity: 0 }
    ]
  },
  {
    id: 'prod-003',
    name: 'MARD PAISA BURGUNDY TEE',
    slug: 'mard-paisa-burgundy-tee',
    price: 1499,
    discount_price: 1199,
    fabric: '100% Combed Premium Cotton',
    gsm: '240 GSM Heavyweight',
    fit_type: 'Oversized Boxy Fit',
    description: 'Edgy Burgundy Maroon oversized drop shoulder t-shirt featuring a bold typography "Aadmi MARD nahi hota, Mard PAISA hota hai" back print with a central flower design.',
    category: { name: 'Minimalist Typo' },
    product_images: [
      { image_url: '/products/mard-paisa-maroon.jpg' },
      { image_url: '/products/mard-paisa-maroon.jpg' }
    ],
    inventory: [
      { size: 'S', quantity: 15 },
      { size: 'M', quantity: 10 },
      { size: 'L', quantity: 14 },
      { size: 'XL', quantity: 8 },
      { size: 'XXL', quantity: 4 }
    ]
  },
  {
    id: 'prod-004',
    name: 'POLARIZE NAVY BLUE TEE',
    slug: 'polarize-navy-blue-tee',
    price: 1299,
    fabric: '100% Combed Cotton',
    gsm: '240 GSM',
    fit_type: 'Oversized Fit',
    description: 'Deep Navy Blue oversized streetwear tee featuring "POLARIZE" front chest block logo and a matching electric blue illustration print on the back.',
    category: { name: 'Minimalist Typo' },
    product_images: [
      { image_url: '/products/polarize-navy.jpg' },
      { image_url: '/products/polarize-navy.jpg' }
    ],
    inventory: [
      { size: 'S', quantity: 6 },
      { size: 'M', quantity: 14 },
      { size: 'L', quantity: 18 },
      { size: 'XL', quantity: 5 },
      { size: 'XXL', quantity: 2 }
    ]
  }
];

export default async function HomePage() {
  let dbProducts = [];
  let dbSettings: any[] = [];
  try {
    const { data: prodData } = await supabase
      .from('products')
      .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
      .eq('is_hidden', false)
      .limit(4);
    
    if (prodData && prodData.length > 0) {
      dbProducts = prodData.map(prod => ({
        ...prod,
        category: prod.category ? { name: (prod.category as any).name } : undefined,
        product_images: prod.product_images || [],
        inventory: prod.inventory || []
      }));
    }

    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('*');
    if (settingsData) {
      dbSettings = settingsData;
    }
  } catch (err) {
    console.error('Error loading Supabase data, using mock data:', err);
  }

  const displayProducts = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

  // Convert array of settings to key-value map
  const settingsMap = dbSettings.reduce((acc: any, item: any) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return (
    <div className="space-y-16">
      {/* Client-side animations wrapper */}
      <HomeClientWrapper products={displayProducts as any} settings={settingsMap} />
    </div>
  );
}
