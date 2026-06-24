// Chronological, timestamped history of a booking — placed → priest events
// (assigned / confirmed / reassigning / proposed) → completed / cancelled.
// Presentational: the page builds the items from the booking + its
// booking_priest_events.

export type TimelineTone = "done" | "active" | "muted" | "alert";

export type TimelineItem = {
  key: string;
  emoji: string;
  title: string;
  detail?: string;
  at?: string; // ISO timestamp
  tone?: TimelineTone;
};

const DOT: Record<TimelineTone, string> = {
  done: "bg-saffron-700 text-white",
  active: "bg-amber-100 text-amber-800",
  muted: "bg-saffron-100 text-saffron-500",
  alert: "bg-red-100 text-red-700",
};

function formatStamp(at: string): string {
  return new Date(at).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) return null;
  return (
    <ol className="relative ml-3 space-y-5 border-l border-saffron-100 pl-6">
      {items.map((it) => (
        <li key={it.key} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full text-xs shadow-sm ${
              DOT[it.tone ?? "muted"]
            }`}
          >
            {it.emoji}
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-sm font-medium text-foreground">{it.title}</p>
            {it.at && (
              <time className="text-xs text-foreground/55" dateTime={it.at}>
                {formatStamp(it.at)}
              </time>
            )}
          </div>
          {it.detail && (
            <p className="mt-0.5 text-xs text-foreground/65">{it.detail}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
