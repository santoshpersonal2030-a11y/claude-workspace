import { createServerSupabase } from '@/lib/supabase/server';
import ReviewModButtons from './ReviewModButtons';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
  products: { name: string } | null;
};

export default async function AdminReviews() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, title, body, is_approved, created_at, products(name)')
    .order('is_approved', { ascending: true })
    .order('created_at', { ascending: false });

  const reviews = (data ?? []) as unknown as Row[];
  const pending = reviews.filter((r) => !r.is_approved).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-burgundy-dark">Reviews</h1>
      <p className="mt-1 text-sm text-burgundy-dark/70">
        {pending > 0
          ? `${pending} review${pending > 1 ? 's' : ''} waiting for approval.`
          : 'No reviews waiting for approval.'}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-gold/40 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gold">
                  {'★'.repeat(r.rating)}
                  <span className="text-gold/30">
                    {'★'.repeat(5 - r.rating)}
                  </span>
                </span>
                <span className="text-sm font-semibold text-burgundy-dark">
                  {r.products?.name ?? 'Product'}
                </span>
                {r.is_approved ? (
                  <span className="rounded bg-gold-soft px-2 py-0.5 text-xs font-medium text-burgundy-dark">
                    Approved
                  </span>
                ) : (
                  <span className="rounded bg-burgundy/10 px-2 py-0.5 text-xs font-medium text-burgundy">
                    Pending
                  </span>
                )}
              </div>
              <ReviewModButtons id={r.id} approved={r.is_approved} />
            </div>
            {r.title && (
              <p className="mt-2 text-sm font-semibold text-burgundy-dark">
                {r.title}
              </p>
            )}
            {r.body && (
              <p className="mt-1 text-sm text-burgundy-dark/80">{r.body}</p>
            )}
          </li>
        ))}
        {reviews.length === 0 && (
          <li className="rounded-xl border border-gold/40 bg-white p-6 text-center text-sm text-burgundy-dark/60">
            No reviews yet.
          </li>
        )}
      </ul>
    </div>
  );
}
