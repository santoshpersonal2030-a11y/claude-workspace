"use client";

import { useEffect, useRef, useState } from "react";

import { jitsiDomain, roomUrl } from "@/lib/video";

// Minimal shape of the Jitsi IFrame API we use.
type JitsiApi = { dispose: () => void };
declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => JitsiApi;
  }
}

const SCRIPT_ID = "jitsi-external-api";

function loadJitsiScript(domain: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("load")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load video library"));
    document.body.appendChild(script);
  });
}

// Embeds a Jitsi room. `displayName` pre-fills the participant's name; the room
// itself is keyed upstream by booking/consultation id.
export default function VideoRoom({
  room,
  displayName,
}: {
  room: string;
  displayName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const domain = jitsiDomain();
    let api: JitsiApi | null = null;
    let cancelled = false;

    loadJitsiScript(domain)
      .then(() => {
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI)
          return;
        api = new window.JitsiMeetExternalAPI(domain, {
          roomName: room,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: displayName ? { displayName } : undefined,
          configOverwrite: { prejoinPageEnabled: true },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      api?.dispose();
    };
  }, [room, displayName]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-saffron-100 bg-white p-8 text-center">
        <p className="text-sm text-foreground/65">
          Couldn&apos;t load the in-page video. Open the room directly instead:
        </p>
        <a
          href={roomUrl(room)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
        >
          Open video room →
        </a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[70vh] w-full overflow-hidden rounded-2xl border border-saffron-100 bg-black shadow-sm"
    />
  );
}
