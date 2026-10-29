import type { Metadata } from "next";
import Link from "next/link";
import { PRICING_COPY } from "@/lib/pricing";
import { ButtonLink, Container } from "@/components/ui";

export const metadata: Metadata = { title: "Pricing", description: PRICING_COPY.tiers + ". One trip workspace, unlimited edits for 30 days." };

const FAQ = [
  ["Is this a subscription?", "No. You pay once per trip. Nothing renews automatically."],
  ["What can I change in 30 days?", "Anything in that one trip: dates, number of days, pace, budget, activities — even the destination. As many times as you like. Your earlier versions are kept so you can go back."],
  ["What happens after 30 days?", "Your plan stays saved and viewable, and you can print it. Editing and new AI plans pause. If you want to keep editing, you can start a new 30-day window."],
  ["Does the price include hotels or flights?", "No. We help you plan and link you to providers like Booking.com, KAYAK and IRCTC. You book and pay them directly."],
  ["We were 4, now we're 5 — what happens?", "Plans for 5 or more travellers use the group price. We ask you to confirm a one-time ₹500 upgrade before applying it. Going from 5 down to 4 never costs anything."],
  ["Is the map free?", "Yes. Browsing, saving places, adding pins and writing reviews are free with a free account."],
  ["Are the budgets exact?", "No — they're clearly labelled estimates to help you plan. Live prices are shown on the provider's site when you book."],
];

export default function Pricing() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-[44px] sm:text-[56px]">One trip, one price.</h1>
        <p className="mt-4 text-[18px] text-ink-soft">{PRICING_COPY.promise}</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Tier title="Free explorer" price="₹0" note="with a free account" points={["Answer the questions and see three matches", "Destination overviews and estimates", "Community map: save, pin and review places"]} cta={<ButtonLink href="/plan" variant="secondary" className="w-full">Find my trip</ButtonLink>} />
        <Tier title="Trip plan · 1–4 travellers" price="₹499" note="one-time, taxes included" highlight points={["Full day-by-day itinerary", "Maps, food, hidden gems and practical notes", "Budget per day and for the trip", "Booking links to trusted providers", "Unlimited edits for 30 days, even a new destination"]} cta={<ButtonLink href="/plan" className="w-full">Find my trip</ButtonLink>} />
        <Tier title="Trip plan · 5+ travellers" price="₹999" note="one-time, taxes included" points={["Everything in the trip plan", "Planned and priced for the whole group", "Upgrade from a 1–4 plan for ₹500 any time within 30 days"]} cta={<ButtonLink href="/plan" variant="secondary" className="w-full">Find my trip</ButtonLink>} />
      </div>
      <p className="mt-6 text-[14px] text-ink-soft">
        {PRICING_COPY.checkout} Payments are processed by Dodo Payments. Prices are charged in INR; your bank may show a converted amount for international cards.{" "}
        <Link href="/refunds" className="underline">
          Refund policy
        </Link>
      </p>
      <section className="mt-16 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="text-[32px]">
          Questions
        </h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="font-serif text-[21px]">{q}</dt>
              <dd className="mt-1.5 text-[16px] text-ink-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Container>
  );
}

function Tier({ title, price, note, points, cta, highlight }: { title: string; price: string; note: string; points: string[]; cta: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex flex-col rounded-[var(--radius-card)] border p-6 ${highlight ? "border-forest bg-forest-soft" : "border-line bg-surface"}`}>
      <p className="font-medium">{title}</p>
      <p className="nums mt-3 font-serif text-[48px] leading-none text-forest">{price}</p>
      <p className="mt-1 text-[14px] text-ink-soft">{note}</p>
      <ul className="mt-6 flex-1 space-y-2 text-[15px]">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
    </div>
  );
}
