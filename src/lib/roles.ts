// Admin role → capability model. Pure and dependency-free so it can be unit
// tested and shared by the layout (nav filtering), page guards and server
// actions (enforcement).

export type AdminRole = "owner" | "manager" | "support";

export const ADMIN_ROLES: AdminRole[] = ["owner", "manager", "support"];

// A capability maps 1:1 to an admin section / sensitive action group.
export type Capability =
  | "analytics"
  | "bookings"
  | "products"
  | "catalog"
  | "pandits"
  | "applications"
  | "reviews"
  | "disputes"
  | "content"
  | "insights"
  | "payroll"
  | "payouts"
  | "coupons"
  | "rewards"
  | "coverage"
  | "messages"
  | "settings"
  | "team";

const OWNER_CAPS: Capability[] = [
  "analytics",
  "bookings",
  "products",
  "catalog",
  "pandits",
  "applications",
  "reviews",
  "disputes",
  "content",
  "insights",
  "payroll",
  "payouts",
  "coupons",
  "rewards",
  "coverage",
  "messages",
  "settings",
  "team",
];

// Operations role: runs the business day-to-day but can't move money out
// (payouts), change global settings or manage the admin team.
const MANAGER_CAPS: Capability[] = [
  "analytics",
  "bookings",
  "products",
  "catalog",
  "pandits",
  "applications",
  "reviews",
  "disputes",
  "content",
  "insights",
  "payroll",
  "coupons",
  "rewards",
  "coverage",
  "messages",
];

// Support role: handle customers and review activity, read-mostly.
const SUPPORT_CAPS: Capability[] = [
  "analytics",
  "bookings",
  "applications",
  "reviews",
  "disputes",
  "insights",
  "messages",
];

const ROLE_CAPS: Record<AdminRole, Capability[]> = {
  owner: OWNER_CAPS,
  manager: MANAGER_CAPS,
  support: SUPPORT_CAPS,
};

export function capabilitiesFor(role: AdminRole | null): Set<Capability> {
  if (!role) return new Set();
  return new Set(ROLE_CAPS[role]);
}

export function can(role: AdminRole | null, cap: Capability): boolean {
  return capabilitiesFor(role).has(cap);
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  manager: "Manager",
  support: "Support",
};

export const ROLE_DESCRIPTION: Record<AdminRole, string> = {
  owner: "Full access including payouts, settings and team management.",
  manager: "Day-to-day operations; no payouts, settings or team management.",
  support: "Customer support and read-only insight into bookings.",
};
