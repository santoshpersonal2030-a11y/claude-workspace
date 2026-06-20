import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { buildGstr3b } from "@/lib/exports";

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const summary = await buildGstr3b(
    searchParams.get("from"),
    searchParams.get("to"),
  );
  return NextResponse.json(summary);
}
