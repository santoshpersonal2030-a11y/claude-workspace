'use client';

import { useState } from 'react';
import { addReview } from './actions';

export default function ReviewForm({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="rounded-lg border border-gold/40 bg-white p-4 text-sm text-burgundy-dark">
        Thank you! Your review will appear once it’s approved.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await addReview({ productId, slug, rating, title, body });
    if (res.ok) setDone(true);
    else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="text-2xl leading-none"
          >
            <span className={(hover || rating) >= n ? 'text-gold' : 'text-gold/30'}>
              ★
            </span>
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="rounded-lg border border-gold/50 bg-white px-3 py-2 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Share your experience with this product…"
        className="rounded-lg border border-gold/50 bg-white px-3 py-2 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
      />

      {error && <p className="text-sm text-burgundy">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="self-start rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream hover:bg-burgundy-dark disabled:opacity-60"
      >
        {busy ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
