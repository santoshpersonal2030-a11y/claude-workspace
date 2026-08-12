import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PWARegister from '@/components/PWARegister';
import { CartProvider } from '@/lib/cart';

export const metadata: Metadata = {
  title: 'Online Pooja Stores — Pooja essentials, delivered',
  description:
    'Shop incense, diyas, garlands, camphor and puja accessories. Cash on Delivery across India, free shipping over ₹999.',
  applicationName: 'Online Pooja Stores',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pooja Stores',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-180.png',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#8b3a3a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
        <PWARegister />
      </body>
    </html>
  );
}
