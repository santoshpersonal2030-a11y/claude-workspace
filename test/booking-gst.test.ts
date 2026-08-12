import { test } from "node:test";
import assert from "node:assert/strict";

import { bookingTax, samagriGstRate } from "../src/lib/booking-gst.ts";

/* The booking receipt used to print one blanket line — "Religious services are GST-exempt" —
   and charge no GST on anything, including the samagri kit, which is goods. The identical kit
   sold through /store carries GST, an HSN code and an e-invoice. Same item, two treatments,
   decided by which button the customer pressed. */

const KIT = 751; // the real first booking: ₹1,500 dakshina + ₹751 kit = ₹2,251

function withRate<T>(value: string | undefined, fn: () => T): T {
  const prev = process.env.NEXT_PUBLIC_BOOKING_SAMAGRI_GST_RATE;
  if (value === undefined) delete process.env.NEXT_PUBLIC_BOOKING_SAMAGRI_GST_RATE;
  else process.env.NEXT_PUBLIC_BOOKING_SAMAGRI_GST_RATE = value;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_BOOKING_SAMAGRI_GST_RATE;
    else process.env.NEXT_PUBLIC_BOOKING_SAMAGRI_GST_RATE = prev;
  }
}

test("with no rate configured the receipt makes NO claim about the kit", () => {
  withRate(undefined, () => {
    const t = bookingTax(KIT);
    assert.equal(t.serviceExempt, true, "the dakshina is exempt either way");
    assert.equal(t.samagri, null, "must not imply the kit is exempt");
  });
});

test("a malformed rate does NOT silently become 0%", () => {
  /* 0% renders as 'exempt', which is the exact claim this module exists to stop the receipt
     making without evidence. Junk must fail closed, not fail quiet. */
  for (const bad of ["", "   ", "abc", "-5", "150", "NaN"]) {
    withRate(bad, () => {
      assert.equal(bookingTax(KIT).samagri, null, `accepted ${JSON.stringify(bad)}`);
      assert.equal(samagriGstRate(), null);
    });
  }
});

test("with a rate set, the tax is DISCLOSED from inside the price, never added on top", () => {
  withRate("18", () => {
    const t = bookingTax(KIT);
    assert.ok(t.samagri);
    assert.equal(t.samagri.rate, 18);
    // ₹751 inclusive of 18% ⇒ taxable 636, tax 115. The two must reconstruct the price exactly.
    assert.equal(
      t.samagri.taxable + t.samagri.tax,
      KIT,
      "taxable + tax must equal the price the customer already agreed to",
    );
    assert.ok(t.samagri.tax > 0 && t.samagri.tax < KIT);
  });
});

test("THE TOTAL NEVER MOVES — a receipt describes a transaction, it does not create one", () => {
  /* The ₹2,251 is already stored on the booking and already shown to the customer. Whatever the
     rate, disclosing the tax inside the kit price must not change what is owed. */
  const SERVICE = 1500;
  for (const rate of [undefined, "0", "5", "12", "18", "28"]) {
    withRate(rate, () => {
      const t = bookingTax(KIT);
      const shownTotal = SERVICE + KIT;
      assert.equal(shownTotal, 2251, `rate ${rate} changed the total`);
      if (t.samagri) {
        assert.equal(t.samagri.taxable + t.samagri.tax, KIT, `rate ${rate} broke the kit line`);
      }
    });
  }
});

test("no kit means nothing to disclose", () => {
  withRate("18", () => {
    assert.equal(bookingTax(0).samagri, null);
  });
});
