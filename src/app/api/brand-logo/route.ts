import { logoJpeg } from "@/lib/logo";

// Serves the brand logo (JPEG) for use in HTML invoices/receipts.
export function GET() {
  const { data } = logoJpeg();
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
