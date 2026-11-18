export interface ColorVariant {
  id: string;
  name: string;
  slug: string;
  colorName: string;
  colorHex: string;
  price: number;
  discountPrice?: number;
  thumbnail: string;
  images: { image_url: string }[];
  inventory: { size: string; quantity: number }[];
  isCurrent: boolean;
}

// Curated palette of premium streetwear color swatches
export const COLOR_PALETTE: Record<string, string> = {
  black: '#111111',
  'vintage black': '#1a1a1a',
  'onyx black': '#0a0a0a',
  'jet black': '#000000',
  white: '#ffffff',
  'off-white': '#faf9f6',
  'bone white': '#f5f5f0',
  cream: '#efebd9',
  beige: '#e8dcca',
  sand: '#d8c7a5',
  tan: '#d2b48c',
  khaki: '#c3b091',
  olive: '#556b2f',
  'washed olive': '#4e5b31',
  'military green': '#4b5320',
  sage: '#87977e',
  navy: '#1b263b',
  'navy blue': '#102a43',
  'midnight blue': '#0b1d3a',
  blue: '#1e3a8a',
  grey: '#6b7280',
  gray: '#6b7280',
  'charcoal grey': '#374151',
  'charcoal gray': '#374151',
  charcoal: '#374151',
  'washed grey': '#4b5563',
  brown: '#5c4033',
  mocha: '#4a3728',
  chocolate: '#3e2723',
  maroon: '#6b1d2f',
  burgundy: '#5b1e31',
  wine: '#4a1525',
  red: '#991b1b',
  rust: '#b45309',
  orange: '#c2410c',
  purple: '#581c87',
  lavender: '#a78bfa',
  pink: '#db2777',
};

// Known color keywords to detect from product names or tags
const KNOWN_COLORS = Object.keys(COLOR_PALETTE).sort((a, b) => b.length - a.length);

/**
 * Extracts explicit or detected color name and hex from product fields
 */
export function extractProductColor(product: {
  name: string;
  description?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
}): { colorName: string; colorHex: string; designBase: string } {
  // 1. Check explicit color_name / color_hex columns if present
  if (product.color_name && product.color_name.trim()) {
    const name = product.color_name.trim();
    const hex = product.color_hex?.trim() || COLOR_PALETTE[name.toLowerCase()] || '#111111';
    const base = product.name.split(/[-–—(|]/)[0].trim();
    return { colorName: name, colorHex: hex, designBase: base };
  }

  // 2. Check metadata comment in description: <!--color:Olive|#556b2f|group:Farebi-->
  if (product.description) {
    const metaMatch = product.description.match(/<!--\s*color:([^|]+)(?:\|([^|>]+))?(?:\|group:([^>]+))?\s*-->/i);
    if (metaMatch) {
      const colorName = metaMatch[1].trim();
      const colorHex = metaMatch[2]?.trim() || COLOR_PALETTE[colorName.toLowerCase()] || '#111111';
      const designBase = metaMatch[3]?.trim() || product.name.split(/[-–—(|]/)[0].trim();
      return { colorName, colorHex, designBase };
    }
  }

  // 3. Smart name detection: e.g. "Farebi - Washed Olive" or "Polarize (Navy)" or "Farebi Olive"
  const productName = product.name.trim();

  // Pattern: "Name - Color" or "Name (Color)" or "Name | Color"
  const delimiterMatch = productName.match(/^(.+?)\s*[-–—(|]\s*([a-zA-Z\s]+?)\)?$/);
  if (delimiterMatch) {
    const potentialBase = delimiterMatch[1].trim();
    const potentialColor = delimiterMatch[2].trim().toLowerCase();
    
    // Check if the suffix is a recognized color
    const matchedColor = KNOWN_COLORS.find(c => c === potentialColor || potentialColor.includes(c));
    if (matchedColor) {
      const formattedColor = delimiterMatch[2].trim();
      const hex = COLOR_PALETTE[matchedColor] || '#111111';
      return { colorName: formattedColor, colorHex: hex, designBase: potentialBase };
    }
  }

  // Fallback check: check if any known color word appears in the name
  const lowerName = productName.toLowerCase();
  for (const c of KNOWN_COLORS) {
    const regex = new RegExp(`\\b${c}\\b`, 'i');
    if (regex.test(lowerName)) {
      const base = productName.replace(new RegExp(`\\s*[-–—(]?\\s*${c}\\s*\\)?`, 'i'), '').trim();
      const formattedColor = c.charAt(0).toUpperCase() + c.slice(1);
      return {
        colorName: formattedColor,
        colorHex: COLOR_PALETTE[c] || '#111111',
        designBase: base || productName,
      };
    }
  }

  // Default fallback if no color mentioned: default to Onyx Black or Classic
  return {
    colorName: 'Vintage Black',
    colorHex: '#111111',
    designBase: productName,
  };
}

/**
 * Finds all sibling color variants for a product from the catalog list
 */
export function findColorVariants(
  currentProduct: any,
  allProducts: any[]
): ColorVariant[] {
  if (!currentProduct || !Array.isArray(allProducts) || allProducts.length === 0) {
    return [];
  }

  const currentInfo = extractProductColor(currentProduct);
  const currentBaseNormalized = currentInfo.designBase.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!currentBaseNormalized) {
    return [];
  }

  // Match all products that share the same normalized design base
  const matchingProducts = allProducts.filter((p) => {
    if (p.is_hidden) return false;
    const pInfo = extractProductColor(p);
    const pBaseNormalized = pInfo.designBase.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Match if identical base name OR one base contains the other
    if (pBaseNormalized === currentBaseNormalized) return true;
    if (pBaseNormalized.length >= 3 && currentBaseNormalized.length >= 3) {
      if (pBaseNormalized.startsWith(currentBaseNormalized) || currentBaseNormalized.startsWith(pBaseNormalized)) {
        return true;
      }
    }
    return false;
  });

  // Only consider it a variant group if there are at least 2 distinct products
  if (matchingProducts.length < 2) {
    return [];
  }

  return matchingProducts.map((p) => {
    const pInfo = extractProductColor(p);
    const images = p.product_images || p.images || [];
    const firstImg = typeof images[0] === 'string' ? images[0] : images[0]?.image_url || '/placeholder-tee.jpg';
    const activePrice = p.discount_price && p.discount_price > 0 ? p.discount_price : p.price;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      colorName: pInfo.colorName,
      colorHex: pInfo.colorHex,
      price: activePrice,
      discountPrice: p.discount_price,
      thumbnail: firstImg,
      images: Array.isArray(images)
        ? images.map((img: any) => ({ image_url: typeof img === 'string' ? img : img?.image_url }))
        : [],
      inventory: p.inventory || [],
      isCurrent: p.id === currentProduct.id,
    };
  });
}
