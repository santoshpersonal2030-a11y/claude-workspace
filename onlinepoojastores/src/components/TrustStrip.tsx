const ITEMS = [
  { icon: '🚚', title: 'Free over ₹999', sub: 'Fast delivery all India' },
  { icon: '💵', title: 'Cash on Delivery', sub: 'Pay when it arrives' },
  { icon: '🪔', title: 'Genuine samagri', sub: 'Hand-picked quality' },
  { icon: '↩️', title: 'Easy replacements', sub: 'On damaged items' },
];

export default function TrustStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ITEMS.map((i) => (
        <div
          key={i.title}
          className="flex items-center gap-3 rounded-xl border border-gold/40 bg-white px-3 py-3"
        >
          <span className="text-2xl" aria-hidden>
            {i.icon}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-burgundy-dark">
              {i.title}
            </span>
            <span className="text-xs text-burgundy-dark/60">{i.sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
