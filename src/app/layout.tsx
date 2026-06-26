import type { Metadata } from 'next';
import { Jost, Cormorant_Garamond } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SoundExperience from '@/components/SoundExperience';
import Atelier from '@/components/Atelier';

const jost = Jost({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jost.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            <SoundExperience />
            <Atelier />
            <main className="flex-grow flex flex-col pb-0">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
        {/* Load Razorpay Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

