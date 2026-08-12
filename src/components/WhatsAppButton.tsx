import { COMPANY } from "@/lib/company";
import { getDictionary, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/* A floating WhatsApp button — the way most Indian customers actually want to reach a business.
 *
 * ⚠️ IT RENDERS NOTHING WHEN THERE IS NO NUMBER, and that is the whole design.
 * NEXT_PUBLIC_COMPANY_PHONE is blank right now: the value that used to sit there was
 * "+91 90000 00000", an invented number nobody could answer. A WhatsApp button pointing at a
 * fake number is worse than no button — a customer taps it, writes a real message about a real
 * ceremony, and nobody ever sees it. Same rule as the GSTIN and SAMAGRI_LEAD_DAYS: when the real
 * value is unknown, show nothing rather than something plausible.
 *
 * Set NEXT_PUBLIC_COMPANY_PHONE to a real WhatsApp number and the button appears by itself. */

/** WhatsApp needs digits only, with the country code and no "+", spaces or dashes. */
export function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  // 10 digits = a bare Indian mobile, so prefix 91. 12 starting 91 is already complete.
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  // Anything else — a landline, a half-typed number, the old 90000 00000 placeholder — is not
  // something we can confidently open a chat to.
  return null;
}

export default function WhatsAppButton({
  locale = DEFAULT_LOCALE,
}: {
  locale?: Locale;
}) {
  const number = whatsappNumber(COMPANY.phone);
  if (!number) return null;

  const { t } = getDictionary(locale);
  const label = t("wa.label");

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(t("wa.prefill"))}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-700"
    >
      {/* The WhatsApp glyph, drawn rather than loaded, so it needs no network request and cannot
          be blocked. aria-hidden because the link above already carries the accessible name. */}
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 fill-white"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 8.24 8.24c0 4.54-3.7 8.23-8.24 8.23Z" />
      </svg>
    </a>
  );
}
