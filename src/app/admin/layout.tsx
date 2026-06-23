import { redirect } from "next/navigation";
import Link from "next/link";

import { getAdminContext } from "@/lib/admin";
import { can, ROLE_LABEL, type Capability } from "@/lib/roles";

const tabs: { href: string; label: string; cap?: Capability }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/analytics", label: "Analytics", cap: "analytics" },
  { href: "/admin/bookings", label: "Bookings & orders", cap: "bookings" },
  { href: "/admin/products", label: "Products", cap: "products" },
  { href: "/admin/poojas", label: "Poojas", cap: "catalog" },
  { href: "/admin/pandits", label: "Pandits", cap: "pandits" },
  { href: "/admin/pandit-applications", label: "Applications", cap: "applications" },
  { href: "/admin/reviews", label: "Reviews", cap: "reviews" },
  { href: "/admin/priest-analytics", label: "Insights", cap: "insights" },
  { href: "/admin/payroll", label: "Payroll", cap: "payroll" },
  { href: "/admin/payouts", label: "Payouts", cap: "payouts" },
  { href: "/admin/muhurat", label: "Muhurat", cap: "catalog" },
  { href: "/admin/peak-days", label: "Peak days", cap: "catalog" },
  { href: "/admin/coupons", label: "Coupons", cap: "coupons" },
  { href: "/admin/rewards", label: "Rewards", cap: "rewards" },
  { href: "/admin/coverage", label: "Coverage", cap: "coverage" },
  { href: "/admin/messages", label: "Messages", cap: "messages" },
  { href: "/admin/team", label: "Team", cap: "team" },
  { href: "/admin/settings", label: "Settings", cap: "settings" },
];

export const metadata = { title: "Admin — BookMyPoojari" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/login?next=/admin");
  const visibleTabs = tabs.filter((t) => !t.cap || can(ctx.role, t.cap));

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-saffron-100 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛕</span>
            <span className="font-heading text-lg text-maroon-800">
              Admin Console
            </span>
          </div>
          <div className="flex items-center gap-3">
            {ctx.role && (
              <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-semibold text-saffron-700">
                {ROLE_LABEL[ctx.role]}
              </span>
            )}
            <Link
              href="/"
              className="text-sm text-foreground/60 hover:text-saffron-700"
            >
              ← Back to site
            </Link>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 sm:px-6">
          <ul className="flex gap-1 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className="block whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-foreground/70 hover:border-saffron-300 hover:text-saffron-700"
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
