import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { asService, one } from "@/lib/db";
import { DISPLAY_CURRENCIES } from "@/lib/geo";
import { Container, PageHeading } from "@/components/ui";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function Profile() {
  const user = await requireUser("/profile");
  const p = await asService((q) =>
    one<{ display_name: string; display_currency: string; timezone: string; marketing_consent: boolean }>(
      q,
      `select display_name, display_currency, timezone, marketing_consent from public.profiles where id = $1`,
      [user.id],
    ),
  );
  return (
    <Container narrow className="py-12">
      <PageHeading title="Profile" lead={`Signed in as ${user.email}.`} />
      <ProfileForm
        initial={{ displayName: p?.display_name ?? user.displayName, currency: p?.display_currency ?? "INR", timezone: p?.timezone ?? "Asia/Kolkata", marketing: p?.marketing_consent ?? false }}
        currencies={[...DISPLAY_CURRENCIES]}
      />
      <section className="mt-12 rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <h2 className="font-serif text-[22px]">Your data</h2>
        <p className="mt-2 text-[15px] text-ink-soft">
          Download everything we hold about you, or ask us to delete your account. Paid trip receipts may be kept where the law requires.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <a href="/api/me/export" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-line-strong px-4 text-[15px] hover:border-forest">
            Download my data (JSON)
          </a>
          <a href="mailto:privacy@ghummakadsaathi.com?subject=Delete%20my%20account" className="inline-flex min-h-11 items-center text-[15px] text-forest underline">
            Request account deletion
          </a>
        </div>
      </section>
    </Container>
  );
}
