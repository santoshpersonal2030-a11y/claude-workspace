import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ContactBody = {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ContactBody;

  const name = body.name?.trim();
  const message = body.message?.trim();
  if (!name || !message) {
    return NextResponse.json(
      { error: "Name and message are required." },
      { status: 400 },
    );
  }

  // RLS allows anonymous inserts into contact_messages, so the public form
  // works whether or not the visitor is signed in.
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    subject: body.subject?.trim() || null,
    message,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
