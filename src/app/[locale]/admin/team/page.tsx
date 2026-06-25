import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/admin";
import { saveAdminMember } from "@/app/[locale]/admin/actions";
import {
  ADMIN_ROLES,
  ROLE_LABEL,
  ROLE_DESCRIPTION,
  type AdminRole,
} from "@/lib/roles";

export const metadata = { title: "Team — Admin" };

const inputClass =
  "rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

export default async function AdminTeamPage() {
  const ctx = await requireCapability("team");
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("profiles")
    .select("id, full_name, email, admin_role")
    .eq("is_admin", true)
    .order("admin_role");

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Team & roles</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Grant console access by email and pick a role. The person must have
        signed in at least once so their account exists.
      </p>

      {/* Role legend */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {ADMIN_ROLES.map((r) => (
          <div
            key={r}
            className="rounded-xl border border-saffron-100 bg-white p-3 shadow-sm"
          >
            <p className="text-sm font-semibold text-maroon-700">
              {ROLE_LABEL[r]}
            </p>
            <p className="mt-1 text-xs text-foreground/65">
              {ROLE_DESCRIPTION[r]}
            </p>
          </div>
        ))}
      </div>

      {/* Add / change */}
      <form
        action={saveAdminMember}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <label className="text-xs text-foreground/65">
          Email
          <input
            name="email"
            type="email"
            required
            placeholder="person@example.com"
            className={`mt-1 block w-64 ${inputClass}`}
          />
        </label>
        <label className="text-xs text-foreground/65">
          Role
          <select name="role" className={`mt-1 block ${inputClass}`}>
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
        >
          Save member
        </button>
      </form>

      {/* Members */}
      <div className="mt-6 space-y-2">
        {(members ?? []).map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-saffron-100 bg-white p-3 text-sm shadow-sm"
          >
            <span className="font-medium text-maroon-700">
              {m.full_name || m.email || m.id.slice(0, 8)}
            </span>
            {m.email && (
              <span className="text-xs text-foreground/65">{m.email}</span>
            )}
            <span className="rounded-full bg-saffron-50 px-2 py-0.5 text-[11px] font-semibold text-saffron-700">
              {ROLE_LABEL[(m.admin_role as AdminRole | null) ?? "owner"]}
            </span>
            {m.id === ctx.user.id && (
              <span className="text-[11px] text-foreground/65">(you)</span>
            )}
            {m.id !== ctx.user.id && m.email && (
              <form action={saveAdminMember} className="ml-auto flex items-center gap-2">
                <input type="hidden" name="email" value={m.email} />
                <select
                  name="role"
                  defaultValue={m.admin_role ?? "owner"}
                  className="rounded-lg border border-saffron-200 bg-cream px-2 py-1 text-xs"
                >
                  {ADMIN_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                  <option value="revoke">Revoke access</option>
                </select>
                <button
                  type="submit"
                  className="rounded-full border border-saffron-300 px-3 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                >
                  Update
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
