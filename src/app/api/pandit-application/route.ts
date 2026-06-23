import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const csv = (v: FormDataEntryValue | null): string[] =>
  ((v as string) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const str = (v: FormDataEntryValue | null): string =>
  ((v as string) ?? "").trim();

async function uploadFile(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix: string,
  file: File,
): Promise<string | null> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) {
    console.error(`Upload to ${bucket} failed:`, error.message);
    return null;
  }
  return path;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`pandit-apply:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many applications. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const form = await request.formData();
  const full_name = str(form.get("full_name"));
  const phone = str(form.get("phone"));
  const id_type = str(form.get("id_type"));
  const id_number = str(form.get("id_number"));

  if (!full_name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required." },
      { status: 400 },
    );
  }
  if (!id_type || !id_number) {
    return NextResponse.json(
      { error: "An ID type and number are required for verification." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Optional uploads: profile photo (public) + KYC document (private).
  let photo_url: string | null = null;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const path = await uploadFile(admin, "pandit-photos", "applications", photo);
    if (path) {
      photo_url = admin.storage.from("pandit-photos").getPublicUrl(path).data
        .publicUrl;
    }
  }

  let id_doc_path: string | null = null;
  const doc = form.get("id_doc");
  if (doc instanceof File && doc.size > 0) {
    id_doc_path = await uploadFile(admin, "kyc-documents", "kyc", doc);
  }

  const { error } = await admin.from("pandit_applications").insert({
    full_name,
    phone,
    email: str(form.get("email")) || null,
    city: str(form.get("city")) || null,
    experience_years: Number(form.get("experience_years")) || null,
    languages: csv(form.get("languages")),
    specializations: csv(form.get("specializations")),
    home_pincode: str(form.get("home_pincode")) || null,
    bio: str(form.get("bio")) || null,
    qualifications: str(form.get("qualifications")) || null,
    id_type,
    id_number,
    id_doc_path,
    photo_url,
    status: "pending",
  });

  if (error) {
    console.error("pandit application insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not submit your application. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
