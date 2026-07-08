import Link from 'next/link';
import type { Category } from '@/lib/types';

// A little visual variety per tile without needing images.
const GRADIENTS = [
  'from-[#8b3a3a] to-[#6b2a2a]',
  'from-[#a4553f] to-[#7a3a2e]',
  'from-[#6b2a2a] to-[#4d1f22]',
  'from-[#9c6b2f] to-[#6b2a2a]',
  'from-[#7a3a2e] to-[#5a2626]',
];
const ICONS: Record<string, string> = {
  'pooja-items': '🛕',
  'flowers-garlands': '🌸',
  'diyas-lights': '🪔',
  'incense-oils': '🕯️',
  'puja-accessories': '🔔',
};

export default function CategoryTiles({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c, i) => (
        <Link
          key={c.id}
          href={`/?category=${c.slug}#shop`}
          className={`group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} p-3 text-cream`}
        >
          <span className="absolute right-2 top-2 text-2xl opacity-80" aria-hidden>
            {ICONS[c.slug] ?? '🛍️'}
          </span>
          <span className="text-sm font-semibold text-gold">{c.name}</span>
          <span className="text-[11px] text-cream/80 group-hover:text-cream">
            Shop now →
          </span>
        </Link>
      ))}
    </div>
  );
}
