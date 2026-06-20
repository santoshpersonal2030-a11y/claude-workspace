import { COMPANY } from "@/lib/company";

// Bottom-of-invoice block: optional QR (left) + authorised-signatory (right).
export default function SignatureBlock({
  qrDataUrl,
}: {
  qrDataUrl?: string | null;
}) {
  return (
    <div className="mt-6 flex items-end justify-between border-t border-saffron-50 pt-4">
      <div>
        {qrDataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Invoice QR" className="h-24 w-24" />
            <p className="mt-1 text-[10px] text-foreground/50">
              {COMPANY.upi ? "Scan to pay via UPI" : "Scan for invoice details"}
            </p>
          </>
        ) : (
          <span />
        )}
      </div>
      <div className="text-right">
        <div className="h-10" />
        <div className="border-t border-foreground/30 pt-1 text-xs text-foreground/70">
          For {COMPANY.name}
        </div>
        <div className="text-xs text-foreground/55">Authorised Signatory</div>
      </div>
    </div>
  );
}
