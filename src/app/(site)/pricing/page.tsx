import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, PRICES, PRICING_COPY, UPGRADE_PRICE } from "@/lib/pricing";
import { payCurrency } from "@/lib/pay-currency";
import { CurrencySwitch } from "@/components/currency-switch";
import { ButtonLink, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pricing — India trip planner",
  description: "Personalised India trip plans from $10 (₹499 in India) for 1–4 travellers, $19 (₹999) for groups. One trip workspace, unlimited edits for 30 days.",
};

const FAQ = [
  ["Is this a subscription?", "No. You pay once per trip. Nothing renews automatically."],
  ["What can I change in 30 days?", "Anything in that one trip: dates, number of days, pace, budget, activities — even the destination. As many times as you like. Your earlier versions are kept so you can go back."],
  ["What happens after 30 days?", "Your plan stays saved and viewable, and you can print it. Editing and new AI plans pause. If you want to keep editing, you can start a new 30-day window."],
  ["Does the price include hotels or flights?", "No. We help you plan and link you to providers like Booking.com, KAYAK and IRCTC. You book and pay them directly."],
  ["We were 4, now we're 5 — what happens?", "Plans for 5 or more travellers use the group price. We ask you to confirm a one-time upgrade (₹500, or $9 outside India) before applying it. Going from 5 down to 4 never costs anything."],
  ["Why are prices different in India?", "Travellers paying from India pay in rupees (₹499 / ₹999). Everyone else pays in US dollars ($10 / $19). You can switch on this page; international cards are processed securely by Dodo Payments."],
  ["Is the map free?", "Yes. Browsing, saving places, adding pins and writing reviews are free with a free account."],
  ["Are the budgets exact?", "No — they're clearly labelled estimates to help you plan. Live prices are shown on the provider's site when you book."],
];

export default async function Pricing() {
  const cur = await payCurrency();
  const fmt = (m: number) => formatPrice(m, cur);
  const alt = cur === "USD" ? "INR" : "USD";
  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-[44px] sm:text-[56px]">One trip, one price.</h1>
        <p className="mt-4 text-[18px] text-ink-soft">{PRICING_COPY.promise}</p>
        <CurrencySwitch current={cur} next="/pricing" className="mt-4" />
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Tier title="Free explorer" price={cur === "USD" ? "$0" : "₹0"} note="with a free account" points={["Answer the questions and see three matches", "Destination overviews and estimates", "Community map: save, pin and review places"]} cta={<ButtonLink href="/plan" variant="secondary" className="w-full">Find my trip</ButtonLink>} />
        <Tier title="Trip plan · 1–4 travellers" price={fmt(PRICES[cur].standard)} note={`one-time, taxes included · ${formatPrice(PRICES[alt].standard, alt)} ${alt === "INR" ? "in India" : "outside India"}`} highlight points={["Full day-by-day itinerary", "Maps, food, hidden gems and practical notes", "Budget per day and for the trip", "Booking links to trusted providers", "Unlimited edits for 30 days, even a new destination"]} cta={<ButtonLink href="/plan" className="w-full">Find my trip</ButtonLink>} />
        <Tier title="Trip plan · 5+ travellers" price={fmt(PRICES[cur].group)} note={`one-time, taxes included · ${formatPrice(PRICES[alt].group, alt)} ${alt === "INR" ? "in India" : "outside India"}`} points={["Everything in the trip plan", "Planned and priced for the whole group", `Upgrade from a 1–4 plan for ${fmt(UPGRADE_PRICE[cur])} any time within 30 days`]} cta={<ButtonLink href="/plan" variant="secondary" className="w-full">Find my trip</ButtonLink>} />
      </div>
      <p className="mt-6 text-[14px] text-ink-soft">
        {PRICING_COPY.checkout} Payments are processed securely by Dodo Payments. {cur === "USD" ? "Charged in US dollars; your bank converts to your currency." : "Charged in Indian rupees; UPI, RuPay and cards accepted."}{" "}
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
