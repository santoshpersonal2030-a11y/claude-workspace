"use client";

// Keyboard/screen-reader skip link. Hidden until focused; on activation it
// focuses the page's <main> landmark (works on every page without per-page
// ids). First focusable element in the DOM.
export default function SkipLink() {
  return (
    <a
      href="#main"
      onClick={(e) => {
        const main = document.querySelector("main");
        if (main) {
          e.preventDefault();
          main.setAttribute("tabindex", "-1");
          (main as HTMLElement).focus();
          main.scrollIntoView();
        }
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-saffron-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
    >
      Skip to content
    </a>
  );
}
