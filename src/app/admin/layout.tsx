import { redirect } from "next/navigation";
import Link from "next/link";

import { getAdminUser } from "@/lib/admin";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings & orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/poojas", label: "Poojas" },
  { href: "/admin/pandits", label: "Pandits" },
  { href: "/admin/payroll", label: "Payroll" },
  { href: "/admin/muhurat", label: "Muhurat" },
  { href: "/admin/peak-days", label: "Peak days" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/coverage", label: "Coverage" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Settings" },
];

export const metadata = { title: "Admin — BookMyPoojari" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect("/login?next=/admin");

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
          <Link
            href="/"
            className="text-sm text-foreground/60 hover:text-saffron-700"
          >
            ← Back to site
          </Link>
        </div>
        <nav className="mx-auto max-w-6xl px-4 sm:px-6">
          <ul className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
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
