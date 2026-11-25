import { Anton, Pacifico, Permanent_Marker, Playfair_Display, Space_Mono, Syne } from 'next/font/google';
import type { FontKey } from '@/lib/customizer';

// Fonts customers can print their text in. Loaded only on /customize.
const syne = Syne({ subsets: ['latin'], weight: ['800'], display: 'swap' });
const anton = Anton({ subsets: ['latin'], weight: ['400'], display: 'swap' });
const marker = Permanent_Marker({ subsets: ['latin'], weight: ['400'], display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'], display: 'swap' });
const mono = Space_Mono({ subsets: ['latin'], weight: ['700'], display: 'swap' });
const pacifico = Pacifico({ subsets: ['latin'], weight: ['400'], display: 'swap' });

export const STUDIO_FONTS: Record<FontKey, { family: string; weight: number }> = {
  bold: { family: syne.style.fontFamily, weight: 800 },
  block: { family: anton.style.fontFamily, weight: 400 },
  street: { family: marker.style.fontFamily, weight: 400 },
  serif: { family: playfair.style.fontFamily, weight: 700 },
  mono: { family: mono.style.fontFamily, weight: 700 },
  script: { family: pacifico.style.fontFamily, weight: 400 },
};
