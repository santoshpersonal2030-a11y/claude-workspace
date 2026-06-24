import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";
import { getConsultation } from "@/lib/consultations";

type ConsultationBody = {
  serviceSlug: string;
  mode?: "phone" | "video";
  preferredDate: string;
  preferredTime: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as ConsultationBody;
  if (
    !body.serviceSlug ||
    !body.preferredDate ||
    !body.preferredTime ||
    !body.name?.trim() ||
    !body.phone?.trim()
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Pricing & metadata come from the server-side catalog, never the client.
  const service = getConsultation(body.serviceSlug);
  if (!service) {
    return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
  }

  // Astrology consults require birth details.
  if (service.needsBirthDetails && (!body.birthDate || !body.birthPlace?.trim())) {
    return NextResponse.json(
      { error: "Birth date and place are required for this consultation." },
      { status: 400 },
    );
  }

  const mode = body.mode === "video" ? "video" : "phone";

  const { data: booking, error } = await supabase
    .from("consultation_bookings")
    .insert({
      user_id: user.id,
      service_slug: service.slug,
      service_name: service.name,
      mode,
      amount: service.price,
      preferred_date: body.preferredDate,
      preferred_time: body.preferredTime,
      birth_date: service.needsBirthDetails ? body.birthDate ?? null : null,
      birth_time: service.needsBirthDetails ? body.birthTime?.trim() || null : null,
      birth_place: service.needsBirthDetails ? body.birthPlace?.trim() || null : null,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || null,
      notes: body.notes?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !booking) {
    return NextResponse.json(
      { error: "Could not create the consultation booking." },
      { status: 500 },
    );
  }

  // Without Razorpay configured, return the booking so the UI can show a
  // "we'll confirm shortly" state without taking payment.
  if (!razorpayConfigured()) {
    return NextResponse.json({ consultationId: booking.id, razorpay: null });
  }

  const order = await createRazorpayOrder({
    amountInPaise: service.price * 100,
    receipt: `consult_${booking.id}`,
    notes: { type: "consultation", consultation_id: booking.id },
  });

  await supabase.from("payments").insert({
    user_id: user.id,
    payment_for: "consultation",
    consultation_id: booking.id,
    amount: service.price,
    currency: "INR",
    razorpay_order_id: order.id,
    status: "created",
  });

  return NextResponse.json({
    consultationId: booking.id,
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  });
}
