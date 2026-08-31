import type { Metadata } from 'next';
import { Inter, Syne, Bebas_Neue } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  variable: '--font-bebas',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ARVIIK | Premium Oversized Streetwear',
  description: 'Luxury printed oversized T-shirts. Crafted with 240 GSM premium cotton, bold designs, and modern minimalist fits. Wear your identity.',
  keywords: ['streetwear', 'oversized t-shirts', 'luxury fashion', 'printed tees', 'arviik clothing'],
  openGraph: {
    title: 'ARVIIK | Premium Oversized Streetwear',
    description: 'Luxury printed oversized T-shirts. Wear your identity.',
    type: 'website',
  },
};

import ArviikPageAnimation from '@/components/ArviikPageAnimation';
import IosZoomLock from '@/components/IosZoomLock';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} ${bebasNeue.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-stone-900 antialiased overflow-x-hidden max-w-full">
        <IosZoomLock />
        <ArviikPageAnimation />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <CartDrawer />
              <main className="flex-grow flex flex-col overflow-x-hidden max-w-full">{children}</main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

