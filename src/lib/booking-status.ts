// Customer-facing "what happens next" line for a booking, derived from its
// status + the priest's response. Shared by the bookings list and detail page.

export type BookingStatusInput = {
  status: string;
  priest_response: string;
  proposed_date?: string | null;
  proposed_time?: string | null;
};

export function nextStepNote(booking: BookingStatusInput): string | null {
  switch (booking.status) {
    case "pending":
      return "Complete payment to confirm your booking.";
    case "confirmed":
      return "We're assigning a verified Pandit — you'll be notified.";
    case "assigned":
      if (booking.priest_response === "accepted")
        return "Your Pandit is confirmed. See you on the day! 🙏";
      if (booking.priest_response === "proposed")
        return booking.proposed_date
          ? `Your Pandit suggested ${booking.proposed_date}${
              booking.proposed_time ? ` at ${booking.proposed_time}` : ""
            }. Our team will confirm with you.`
          : "Your Pandit suggested a new time. Our team will confirm with you.";
      if (booking.priest_response === "declined")
        return "We're reassigning your Pandit.";
      return "Waiting for your Pandit to confirm the slot.";
    default:
      return null;
  }
}
