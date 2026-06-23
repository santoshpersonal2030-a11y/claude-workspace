import { NextResponse } from "next/server";

import {
  getParticipant,
  listMessages,
  markThreadRead,
  sendMessage,
} from "@/lib/messaging";

// GET — the thread for a booking (also marks the caller's incoming messages
// read). 403 if the caller isn't a participant.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const participant = await getParticipant(id);
  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const messages = await listMessages(id);
  await markThreadRead(id, participant.userId);
  return NextResponse.json({ role: participant.role, messages });
}

// POST — send a message to the thread.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const participant = await getParticipant(id);
  if (!participant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { body?: string };
  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }
  const message = await sendMessage(participant, body.body);
  return NextResponse.json({ message });
}
