'use client';

import ProductDetailClient from '../shop/[slug]/ProductDetailClient';

const fakeProduct = {
  id: 'test-id',
  name: 'Test On Fire Product',
  slug: 'test-onfire-product',
  price: 999,
  category: 'On Fire',
  product_images: [],
  inventory: [],
};

export default function DevTestOnFirePage() {
  return <ProductDetailClient product={fakeProduct} />;
}
