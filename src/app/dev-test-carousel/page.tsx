'use client';

import type { ReactNode } from 'react';
import Curved3DCarousel from '@/components/Curved3DCarousel';
import PanoramicCurveCarousel from '@/components/PanoramicCurveCarousel';
import CurvedWallCarousel from '@/components/CurvedWallCarousel';

const DEMO_ITEMS = [
  {
    id: '1',
    image: '/products/farebi-olive.jpg',
    tag: '1. DARK OLIVE',
    subtitle: 'ARVIIK',
    title: 'Farebi Tee',
    caption: 'Heavyweight 240 GSM Cotton',
  },
  {
    id: '2',
    image: '/products/mard-paisa-maroon.jpg',
    tag: '2. MAROON',
    subtitle: 'ARVIIK',
    title: 'Mard Paisa Tee',
    caption: 'Oversized Boxy Fit',
  },
  {
    id: '3',
    image: '/products/polarize-navy.jpg',
    tag: '3. MIDNIGHT NAVY',
    subtitle: 'ARVIIK',
    title: 'Polarize Tee',
    caption: 'Chaos Creates Clarity',
  },
  {
    id: '4',
    image: '/products/polarize-cream.jpg',
    tag: '4. VINTAGE CREAM',
    subtitle: 'ARVIIK',
    title: 'Polarize Tee',
    caption: 'Limited Drop',
  },
  {
    id: '5',
    image: '/products/farebi-olive.jpg',
    tag: '5. DARK OLIVE',
    subtitle: 'ARVIIK',
    title: 'Farebi Tee',
    caption: '100% Authentic',
  },
  {
    id: '6',
    image: '/products/mard-paisa-maroon.jpg',
    tag: '6. MAROON',
    subtitle: 'ARVIIK',
    title: 'Mard Paisa Tee',
    caption: 'Pan-India Free Delivery',
  },
];

const PANORAMIC_PANELS = [
  {
    id: 'p1',
    image: '/products/farebi-olive.jpg',
    caption: 'The box celebrates the craft behind every stitch, a tribute to Indian streetwear.',
  },
  {
    id: 'p2',
    image: '/products/polarize-navy.jpg',
    caption: 'The see-through ripstop panel lets the print underneath become part of the fit.',
  },
  {
    id: 'p3',
    image: '/products/mard-paisa-maroon.jpg',
    caption: 'Heavyweight 240 GSM cotton, cut for an oversized, boxy silhouette.',
  },
  {
    id: 'p4',
    image: '/products/polarize-cream.jpg',
    caption: 'Limited-run colourway, dropped once and never restocked.',
  },
  {
    id: 'p5',
    image: '/products/farebi-olive.jpg',
    caption: 'Every piece ships pan-India with free, tracked delivery.',
  },
  {
    id: 'p6',
    image: '/products/mard-paisa-maroon.jpg',
    caption: '100% authentic, verified straight from the ARVIIK atelier.',
  },
];

const WALL_PANELS = [
  {
    id: 'w1',
    image: '/products/farebi-olive.jpg',
    caption: 'Heavyweight 240 GSM cotton, brushed for softness.',
  },
  {
    id: 'w2',
    image: '/products/mard-paisa-maroon.jpg',
    caption: 'Garment-dyed for a lived-in, vintage finish.',
  },
  {
    id: 'w3',
    image: '/products/polarize-navy.jpg',
    caption: 'Drop-shoulder cut, built for an oversized silhouette.',
  },
  {
    id: 'w4',
    image: '/products/polarize-cream.jpg',
    caption: 'Hand-placed prints, screen by screen.',
  },
  {
    id: 'w5',
    image: '/products/farebi-olive.jpg',
    caption: 'Reinforced double-stitched hems for the long run.',
  },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="bg-yellow-400 text-black text-center py-3 font-mono font-extrabold text-sm uppercase tracking-widest">
      {children}
    </div>
  );
}

export default function DevTestCarouselPage() {
  return (
    <div className="bg-black min-h-screen">
      <SectionLabel>Latest — Curved Wall (scroll-snap + rotateY, olive/charcoal)</SectionLabel>
      <CurvedWallCarousel
        panels={WALL_PANELS}
        eyebrow="Behind The Seams"
        heading="Built Different"
        ctaLabel="Shop Now"
      />

      <div className="h-px bg-white/10" />

      <SectionLabel>Variant 2 — Panoramic Lens Carousel (border-radius curve)</SectionLabel>
      <PanoramicCurveCarousel
        panels={PANORAMIC_PANELS}
        heading="Mission Breakdown"
        ctaLabel="Explore Now"
      />

      <div className="h-px bg-white/10" />

      <SectionLabel>Variant 1 — Coverflow Carousel (absolute-positioned cards)</SectionLabel>
      <Curved3DCarousel
        items={DEMO_ITEMS}
        eyebrow="Arviik Catalog"
        heading="The Craft & Concept"
      />
    </div>
  );
}
