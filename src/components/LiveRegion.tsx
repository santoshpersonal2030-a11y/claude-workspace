"use client";

import { useAnnouncement } from "@/lib/announce";

// One global polite live region for the whole app. Screen readers announce any
// text passed to announce() (cart changes, async results) without stealing
// focus. Visually hidden; mounted once in the root layout.
export default function LiveRegion() {
  const message = useAnnouncement();
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
