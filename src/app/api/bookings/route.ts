import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createRazorpayOrder,
  razorpayConfigured,
} from "@/lib/razorpay";
import { resolveTravelBand, isValidPincode } from "@/lib/travel";
import { getPeakDay, peakSurchargeAmount } from "@/lib/peak-days";
import { geoConfigured, resolveTravelBandGeo } from "@/lib/geo";

const DEFAULT_KIT_PRICE = 751;

type BookingBody = {
  poojaSlug: string;
  bookingDate: string;
  timeSlot: string;
  startTime?: string; // "HH:MM" — present for scheduled (flexible) bookings
  language?: string;
  panditSlug?: string;
  address: string;
  city: string;
  pincode?: string;
  notes?: string;
  samagriKit?: boolean;
};

// Maps a booking-RPC error to a friendly message; null if not a known case.
function scheduleErrorMessage(message: string): string | null {
  if (message.includes("PANDIT_UNAVAILABLE") || message.includes("bookings_no_overlap"))
    return "That time was just taken or is too close to another booking. Please pick another slot.";
  if (message.includes("OUTSIDE_WORKING_HOURS"))
    return "That time is outside the Pandit's working hours.";
  if (message.includes("PANDIT_BLACKOUT"))
    return "The Pandit is unavailable on that date. Please choose another day.";
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as BookingBody;
  if (!body.poojaSlug || !body.bookingDate || !body.timeSlot || !body.address) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Look up the pooja and trust the DB for pricing — never the client.
  const { data: pooja, error: poojaError } = await supabase
    .from("poojas")
    .select("id, starting_price, samagri_kit_price, duration_hours, requires_muhurat")
    .eq("slug", body.poojaSlug)
    .eq("active", true)
    .maybeSingle();

  if (poojaError || !pooja) {
    return NextResponse.json({ error: "Pooja not found" }, { status: 404 });
  }

  const servicePrice = pooja.starting_price;
  const samagriPrice = body.samagriKit
    ? (pooja.samagri_kit_price ?? DEFAULT_KIT_PRICE)
    : 0;

  // Resolve the chosen pandit (a preference for muhurat/"any available", or the
  // priest to hard-book for a scheduled flexible pooja).
  let pandit:
    | {
        id: string;
        home_pincode: string | null;
        service_pincodes: string[];
        max_travel_mins: number;
      }
    | null = null;
  if (body.panditSlug) {
    const { data } = await supabase
      .from("pandits")
      .select("id, home_pincode, service_pincodes, max_travel_mins")
      .eq("slug", body.panditSlug)
      .eq("active", true)
      .maybeSingle();
    pandit = data ?? null;
  }

  // Travel fee (server-authoritative) when a specific pandit + valid pincode
  // are known. resolveTravelBand returns null if the pandit doesn't serve it.
  const pincode = body.pincode?.trim() || null;
  let band =
    pandit && pincode && isValidPincode(pincode)
      ? resolveTravelBand(pincode, {
          homePincode: pandit.home_pincode,
          servicePincodes: pandit.service_pincodes,
        })
      : null;

  // Geo upgrade: when Google Distance Matrix is configured, refine the band by
  // real driving distance/time. Falls back to the manual band on any failure.
  if (pandit && pincode && isValidPincode(pincode) && geoConfigured()) {
    const geo = await resolveTravelBandGeo(
      pandit.home_pincode,
      pincode,
      pandit.max_travel_mins,
    );
    if (geo) band = geo.band;
  }

  const travelFee = band?.fee ?? 0;

  // Peak-day premium (server-authoritative): a percentage uplift on the
  // dakshina for festival / high-demand dates. Snapshotted on the booking.
  const peakDay = await getPeakDay(body.bookingDate);
  const peakSurcharge = peakDay
    ? peakSurchargeAmount(servicePrice, peakDay.surchargePct)
    : 0;
  const peakLabel = peakDay?.label ?? null;

  const total = servicePrice + samagriPrice + travelFee + peakSurcharge;

  // Scheduled path: a flexible pooja with a specific serving pandit and a slot
  // time → reserve the exact slot atomically (race-safe gap + overlap guard).
  const scheduled =
    !pooja.requires_muhurat && pandit && band && body.startTime;

  let bookingId: string;

  if (scheduled && pandit && body.startTime) {
    const startsAtIso = new Date(
      `${body.bookingDate}T${body.startTime}:00+05:30`,
    ).toISOString();
    const admin = createAdminClient();
    const { data: rpcId, error: rpcError } = await admin.rpc(
      "create_booking_atomic",
      {
        p_user_id: user.id,
        p_pooja_id: pooja.id,
        p_pandit_id: pandit.id,
        p_starts_at: startsAtIso,
        p_duration_min: Math.round(Number(pooja.duration_hours) * 60),
        p_time_slot: body.timeSlot || body.startTime,
        p_language: body.language ?? null,
        p_address: body.address,
        p_city: body.city,
        p_pincode: pincode,
        p_notes: body.notes ?? null,
        p_samagri_kit: Boolean(body.samagriKit),
        p_service_price: servicePrice,
        p_samagri_price: samagriPrice,
        p_travel_fee: travelFee,
        p_travel_band: band?.id ?? null,
        p_peak_surcharge: peakSurcharge,
        p_peak_label: peakLabel,
      },
    );

    if (rpcError || !rpcId) {
      const friendly = scheduleErrorMessage(rpcError?.message ?? "");
      return NextResponse.json(
        { error: friendly ?? "Could not reserve that slot." },
        { status: friendly ? 409 : 500 },
      );
    }
    bookingId = rpcId as string;
  } else {
    // Legacy path: muhurat (propose-then-confirm) or "any available" — record
    // the request with the pandit as a preference for an admin to confirm.
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        pooja_id: pooja.id,
        preferred_pandit_id: pandit?.id ?? null,
        booking_date: body.bookingDate,
        time_slot: body.timeSlot,
        language: body.language ?? null,
        address: body.address,
        city: body.city,
        pincode: pincode,
        notes: body.notes ?? null,
        samagri_kit: Boolean(body.samagriKit),
        service_price: servicePrice,
        samagri_price: samagriPrice,
        travel_fee: travelFee,
        travel_band: band?.id ?? null,
        peak_surcharge: peakSurcharge,
        peak_label: peakLabel,
        total_amount: total,
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Could not create booking" },
        { status: 500 },
      );
    }
    bookingId = booking.id;
  }

  const booking = { id: bookingId };

  // If Razorpay isn't configured yet, return the booking so the UI can show a
  // "we'll confirm shortly" state without payment.
  if (!razorpayConfigured()) {
    return NextResponse.json({ bookingId: booking.id, razorpay: null });
  }

  const order = await createRazorpayOrder({
    amountInPaise: total * 100,
    receipt: `booking_${booking.id}`,
    notes: { type: "booking", booking_id: booking.id },
  });

  await supabase.from("payments").insert({
    user_id: user.id,
    payment_for: "booking",
    booking_id: booking.id,
    amount: total,
    currency: "INR",
    razorpay_order_id: order.id,
    status: "created",
  });

  return NextResponse.json({
    bookingId: booking.id,
    razorpay: {
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  });
}
