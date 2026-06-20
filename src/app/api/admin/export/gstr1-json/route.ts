import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { buildGstr1Json } from "@/lib/exports";

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const json = await buildGstr1Json(
    searchParams.get("from"),
    searchParams.get("to"),
    searchParams.get("period"),
  );

  return new Response(JSON.stringify(json, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="gstr1-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}
