import Link from "next/link";
import { requireRole, hasRole } from "@/lib/auth";
import { Container } from "@/components/ui";

export const metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  ["/admin", "Overview", "moderator"],
  ["/admin/places", "Place submissions", "moderator"],
  ["/admin/reviews", "Reports", "moderator"],
  ["/admin/sponsors", "Sponsors", "admin"],
  ["/admin/campaigns", "Campaigns", "admin"],
  ["/admin/referrals", "Referrals", "admin"],
  ["/admin/payments", "Payments", "admin"],
  ["/admin/provider-status", "Providers", "admin"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("moderator", "/admin");
  const isAdmin = hasRole(user, "admin");
  return (
    <Container className="grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Admin" className="lg:sticky lg:top-6 lg:h-fit">
        <p className="font-serif text-[22px]">Admin</p>
        <p className="text-[13px] text-ink-soft">{isAdmin ? "Administrator" : "Moderator"}</p>
        <ul className="scroller mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {NAV.filter(([, , role]) => role === "moderator" || isAdmin).map(([href, label]) => (
            <li key={href} className="shrink-0">
              <Link href={href} className="block rounded-[10px] px-3 py-2.5 text-[15px] hover:bg-surface">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </Container>
  );
}
