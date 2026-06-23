// SERVER-ONLY RazorpayX Payouts helpers. Like the payments client, we call the
// REST API directly with Basic auth — no SDK. Entirely dormant until the
// RAZORPAYX_* env vars are set, so the payroll UI degrades to manual mark-paid.

const RAZORPAY_API = "https://api.razorpay.com/v1";

export function razorpayxConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAYX_KEY_ID &&
      process.env.RAZORPAYX_KEY_SECRET &&
      process.env.RAZORPAYX_ACCOUNT_NUMBER,
  );
}

function authHeader(): string {
  const id = process.env.RAZORPAYX_KEY_ID!;
  const secret = process.env.RAZORPAYX_KEY_SECRET!;
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

async function call<T>(
  path: string,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["X-Payout-Idempotency"] = idempotencyKey;

  const res = await fetch(`${RAZORPAY_API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { error?: { description?: string } })?.error?.description ||
      `RazorpayX ${path} failed (${res.status})`;
    throw new Error(msg);
  }
  return json as T;
}

// Creates a contact (the payee). Returns its id.
export async function createContact(args: {
  name: string;
  phone?: string | null;
  email?: string | null;
  referenceId: string;
}): Promise<string> {
  const c = await call<{ id: string }>("/contacts", {
    name: args.name,
    contact: args.phone || undefined,
    email: args.email || undefined,
    type: "vendor",
    reference_id: args.referenceId,
  });
  return c.id;
}

// Creates a bank fund account for a contact. Returns its id.
export async function createFundAccount(args: {
  contactId: string;
  accountName: string;
  ifsc: string;
  accountNumber: string;
}): Promise<string> {
  const f = await call<{ id: string }>("/fund_accounts", {
    contact_id: args.contactId,
    account_type: "bank_account",
    bank_account: {
      name: args.accountName,
      ifsc: args.ifsc,
      account_number: args.accountNumber,
    },
  });
  return f.id;
}

export type PayoutResult = {
  id: string;
  status: string; // queued | pending | processing | processed | reversed | cancelled | failed
  utr: string | null;
};

// Initiates an IMPS/NEFT payout from the business account to a fund account.
// `idempotencyKey` (the payroll line id) makes retries safe at Razorpay's end.
export async function createPayout(args: {
  fundAccountId: string;
  amountInPaise: number;
  referenceId: string;
  narration?: string;
  idempotencyKey: string;
}): Promise<PayoutResult> {
  const p = await call<{ id: string; status: string; utr: string | null }>(
    "/payouts",
    {
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      fund_account_id: args.fundAccountId,
      amount: args.amountInPaise,
      currency: "INR",
      mode: "IMPS",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: args.referenceId,
      narration: args.narration?.slice(0, 30) || "BookMyPoojari",
    },
    args.idempotencyKey,
  );
  return { id: p.id, status: p.status, utr: p.utr ?? null };
}
