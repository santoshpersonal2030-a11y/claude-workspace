// Live video delivery via Jitsi. We embed a Jitsi Meet room (default the free
// meet.jit.si; override with NEXT_PUBLIC_JITSI_DOMAIN for an 8x8 JaaS / self-
// hosted deployment). Rooms are keyed by the booking/consultation id so both
// sides land in the same room without any server-side room provisioning.

export function jitsiDomain(): string {
  return process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";
}

// Deterministic, hard-to-guess room names (the id is a UUID). For a public
// Jitsi the name is the only access control; move to JaaS + JWT for stronger
// guarantees when traffic warrants it.
export function poojaRoomName(bookingId: string): string {
  return `bmp-pooja-${bookingId}`;
}

export function consultRoomName(consultationId: string): string {
  return `bmp-consult-${consultationId}`;
}

export function roomUrl(room: string): string {
  return `https://${jitsiDomain()}/${room}`;
}
