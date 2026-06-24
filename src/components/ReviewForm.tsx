"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100";

export default function ReviewForm({ productSlug }: { productSlug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoaded(true);
    });
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, rating, title, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not submit your review.");
      }
      setSent(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  if (!user) {
    return (
      <div className="rounded-2xl border border-saffron-100 bg-white p-5 text-sm text-foreground/70 shadow-sm">
        <Link
          href={`/login?next=/store/${productSlug}`}
          className="font-semibold text-saffron-700 hover:text-saffron-800"
        >
          Sign in
        </Link>{" "}
        to write a review. Only verified buyers can review a product.
      </div>
    );
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-saffron-100 bg-white p-5 text-sm text-foreground/75 shadow-sm">
        🙏 Thank you! Your review has been saved.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
    >
      <h3 className="font-heading text-lg text-maroon-700">Write a review</h3>

      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl leading-none"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-pressed={rating === n}
          >
            <span
              className={
                n <= (hover || rating) ? "text-gold-500" : "text-foreground/25"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>

      <input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`mt-3 ${inputClass}`}
      />
      <textarea
        placeholder="Share your experience (optional)"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={`mt-3 ${inputClass}`}
      />

      {error && (
        <p className="mt-3 rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
