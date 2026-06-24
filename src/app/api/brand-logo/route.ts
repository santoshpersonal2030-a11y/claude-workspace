import { getLogoJpeg } from "@/lib/logo";

// Serves the brand logo (JPEG) — admin-uploaded if present, else generated.
export async function GET() {
  const { data } = await getLogoJpeg();
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
