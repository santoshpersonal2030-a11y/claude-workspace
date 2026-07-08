import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/lib/cart';

export const metadata: Metadata = {
  title: 'Online Pooja Stores — Pooja essentials, delivered',
  description:
    'Shop incense, diyas, garlands, camphor and puja accessories. Cash on Delivery across India, free shipping over ₹999.',
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
      </body>
    </html>
  );
}
