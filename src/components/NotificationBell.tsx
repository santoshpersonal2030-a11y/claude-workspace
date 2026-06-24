"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

type Note = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

// Header notification bell. Reads the signed-in user's own notifications
// (RLS-scoped), polls periodically, and marks them read on open.
export default function NotificationBell() {
  const supabase = useMemo(() => createClient(), []);
  const [signedIn, setSignedIn] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);

  const unread = notes.filter((n) => !n.read_at).length;

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSignedIn(false);
      return;
    }
    setSignedIn(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    setNotes(data ?? []);
  }, [supabase]);

  useEffect(() => {
    const run = () => void load();
    const first = setTimeout(run, 0);
    // Slow poll as a fallback; realtime (below) handles the common case.
    const timer = setInterval(run, 60000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  // Realtime: refresh when a notification is inserted for this user.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      channel = supabase
        .channel(`notifications:${data.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${data.user.id}`,
          },
          () => void load(),
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  // Escape closes the open panel.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      const ids = notes.filter((n) => !n.read_at).map((n) => n.id);
      setNotes((prev) =>
        prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
      );
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids);
    }
  }

  if (!signedIn) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="notification-panel"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-saffron-50 hover:text-saffron-700"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            id="notification-panel"
            role="region"
            aria-label="Notifications"
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-lg"
          >
            <div className="border-b border-saffron-50 px-4 py-2 text-sm font-semibold text-maroon-700">
              Notifications
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-foreground/65">
                  You&apos;re all caught up.
                </p>
              ) : (
                notes.map((n) => {
                  const inner = (
                    <>
                      <p className="text-sm font-medium text-foreground/85">
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-foreground/65">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-foreground/65">
                        {new Date(n.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </>
                  );
                  return n.link ? (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setOpen(false)}
                      className="block border-b border-saffron-50 px-4 py-3 last:border-0 hover:bg-cream"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={n.id}
                      className="border-b border-saffron-50 px-4 py-3 last:border-0"
                    >
                      {inner}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
