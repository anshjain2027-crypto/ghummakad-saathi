import { formatMoney } from "@/lib/geo";

export function Band({ band, currency = "INR", className = "" }: { band: [number, number]; currency?: string; className?: string }) {
  const [lo, hi] = band;
  return (
    <span className={`nums ${className}`}>
      {formatMoney(lo, currency)}–{formatMoney(hi, currency).replace(/^[^\d]*/, "")}
      {currency !== "INR" ? <span className="sr-only"> (indicative conversion)</span> : null}
    </span>
  );
}
