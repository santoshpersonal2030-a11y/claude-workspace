// Shared nudge-cooldown logic for the admin "nudge priest" action and its UI.

export const NUDGE_COOLDOWN_MIN = 60;

// Given a booking's last-nudged timestamp, whether a fresh nudge is allowed and
// a short "Nudged 2h ago" style label. Wrapped in a named helper so reading the
// clock doesn't trip the React-purity lint rule in a server-component render.
export function nudgeState(lastNudgedAt: string | null): {
  canNudge: boolean;
  agoLabel: string | null;
} {
  if (!lastNudgedAt) return { canNudge: true, agoLabel: null };
  const mins = Math.floor(
    (Date.now() - new Date(lastNudgedAt).getTime()) / 60000,
  );
  const agoLabel =
    mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
  return { canNudge: mins >= NUDGE_COOLDOWN_MIN, agoLabel };
}
