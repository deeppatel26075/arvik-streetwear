import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  // Headless Chromium used on the server to render invoice PDFs for the
  // order thank-you email; must not be bundled.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
