import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { buildGstr1Json } from "@/lib/exports";
import { validateGstr1 } from "@/lib/gstr1-validate";

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

  // Schema-check against the GSTN offline-tool format before letting the file
  // out. Hard errors (malformed GSTIN/HSN/POS) block the download so they're
  // fixed before a portal upload fails; warnings are surfaced but don't block.
  const report = validateGstr1(json);
  if (!report.valid) {
    return NextResponse.json(
      {
        valid: false,
        message:
          "GSTR-1 JSON failed schema validation — fix these before uploading to the portal.",
        errors: report.errors,
        warnings: report.warnings,
      },
      { status: 422 },
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="gstr1-${new Date()
      .toISOString()
      .slice(0, 10)}.json"`,
  };
  // Non-blocking warnings ride along in a header for tooling/logs.
  if (report.warnings.length) {
    headers["X-Gstr1-Warnings"] = String(report.warnings.length);
  }

  return new Response(JSON.stringify(json, null, 2), { headers });
}
