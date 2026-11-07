import type { PayCurrency } from "@/lib/pricing";

/** "Paying from India? Pay in ₹" — switches which price list is shown and charged. */
export function CurrencySwitch({ current, next, className = "" }: { current: PayCurrency; next: string; className?: string }) {
  const other: PayCurrency = current === "INR" ? "USD" : "INR";
  const href = `/api/pay-currency?c=${other}&next=${encodeURIComponent(next)}`;
  return (
    <p className={`text-[13px] text-ink-soft ${className}`}>
      {current === "INR" ? "Paying from outside India?" : "Paying from India?"}{" "}
      <a href={href} className="font-medium text-forest underline underline-offset-2" rel="nofollow">
        {other === "USD" ? "See prices in US dollars" : "See prices in rupees (₹)"}
      </a>
    </p>
  );
}
