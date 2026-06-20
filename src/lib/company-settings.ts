// SERVER-ONLY: resolves the seller/business details shown on invoices, merging
// admin-edited values from the company_settings table over the env defaults in
// COMPANY. Reads are deduped per request via React cache(); writes go through
// saveCompany(). Falls back to the env defaults if the row is missing or the
// DB is unreachable (e.g. during static build).

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY, splitAddress, type Company } from "@/lib/company";

export const getCompany = cache(async (): Promise<Company> => {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("company_settings")
      .select("name, gstin, state, upi, email, phone, address")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return COMPANY;

    const address = data.address?.trim();
    return {
      name: data.name?.trim() || COMPANY.name,
      gstin: data.gstin?.trim() || COMPANY.gstin,
      state: data.state?.trim() || COMPANY.state,
      upi: data.upi?.trim() ?? COMPANY.upi,
      email: data.email?.trim() || COMPANY.email,
      phone: data.phone?.trim() || COMPANY.phone,
      addressLines: address ? splitAddress(address) : COMPANY.addressLines,
    };
  } catch (err) {
    console.error("getCompany failed, using env defaults:", err);
    return COMPANY;
  }
});

// The raw stored fields (for pre-filling the admin settings form).
export type CompanySettingsRow = {
  name: string;
  gstin: string;
  state: string;
  upi: string;
  email: string;
  phone: string;
  address: string;
};

export async function getCompanySettings(): Promise<CompanySettingsRow> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("company_settings")
      .select("name, gstin, state, upi, email, phone, address")
      .eq("id", 1)
      .maybeSingle();
    return {
      name: data?.name ?? "",
      gstin: data?.gstin ?? "",
      state: data?.state ?? "",
      upi: data?.upi ?? "",
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      address: data?.address ?? "",
    };
  } catch {
    return { name: "", gstin: "", state: "", upi: "", email: "", phone: "", address: "" };
  }
}

export async function saveCompany(fields: CompanySettingsRow): Promise<void> {
  const admin = createAdminClient();
  await admin.from("company_settings").upsert({
    id: 1,
    name: fields.name || null,
    gstin: fields.gstin || null,
    state: fields.state || null,
    upi: fields.upi || null,
    email: fields.email || null,
    phone: fields.phone || null,
    address: fields.address || null,
    updated_at: new Date().toISOString(),
  });
}
