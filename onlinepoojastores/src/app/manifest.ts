import type { MetadataRoute } from 'next';

// The web app manifest — this is what makes the site installable as an app on
// Android and iPhone ("Add to Home Screen"), with an icon and full-screen mode.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Online Pooja Stores',
    short_name: 'Pooja Stores',
    description:
      'Shop pooja essentials — incense, diyas, garlands, camphor and more. Cash on Delivery across India.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fffaf5',
    theme_color: '#8b3a3a',
    categories: ['shopping'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
