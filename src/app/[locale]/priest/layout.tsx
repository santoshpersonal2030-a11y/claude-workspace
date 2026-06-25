import { redirect } from "next/navigation";
import Link from "next/link";

import { getPriestPandit } from "@/lib/priest";

const tabs = [
  { href: "/priest", label: "Dashboard" },
  { href: "/priest/calendar", label: "Calendar" },
  { href: "/priest/availability", label: "Availability" },
  { href: "/priest/messages", label: "Messages" },
  { href: "/priest/payslips", label: "Payslips" },
];

export const metadata = { title: "Priest Portal — BookMyPoojari" };

export default async function PriestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pandit = await getPriestPandit();
  if (!pandit) redirect("/login?next=/priest");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-saffron-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🙏</span>
            <span className="font-heading text-lg text-maroon-800">
              Priest Portal
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-foreground/65 sm:inline">
              {pandit.full_name}
            </span>
            <Link href="/" className="text-foreground/65 hover:text-saffron-700">
              ← Site
            </Link>
          </div>
        </div>
        <nav className="mx-auto max-w-5xl px-4 sm:px-6">
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
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
