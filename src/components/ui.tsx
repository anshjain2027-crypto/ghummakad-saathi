import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 text-[15px] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-forest text-cream hover:bg-forest-deep",
  secondary: "border border-line-strong bg-surface text-charcoal hover:border-forest hover:text-forest",
  ghost: "px-2 text-forest underline-offset-4 hover:underline",
  danger: "border border-error/40 bg-surface text-error hover:bg-error-soft",
  light: "bg-cream text-forest-deep hover:bg-white",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Chip({ children, tone = "sand" }: { children: ReactNode; tone?: "sand" | "forest" | "plain" | "terracotta" }) {
  const tones = {
    sand: "bg-sand-soft text-[#5a4518]",
    forest: "bg-forest-soft text-forest-deep",
    plain: "border border-line bg-surface text-ink-soft",
    terracotta: "bg-[#f7ddd2] text-terracotta-deep",
  };
  return <span className={`inline-flex items-center rounded-[var(--radius-chip)] px-2.5 py-1 text-[13px] font-medium ${tones[tone]}`}>{children}</span>;
}

/** The DESIGN.md disclaimer, used everywhere an estimate appears. */
export function Illustrative({ className = "", text = "Illustrative estimate — not live pricing." }: { className?: string; text?: string }) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-[13px] text-ink-soft ${className}`}>
      <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" className="shrink-0">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v4M8 4.6v.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {text}
    </p>
  );
}

export function SponsoredLabel({ demo }: { demo?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[6px] border border-[#5a4518]/30 bg-sand-soft px-2 py-0.5 text-[12px] font-semibold text-[#5a4518]">
      Sponsored{demo ? " · demo" : ""}
    </span>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warning" | "error" | "success"; title?: string; children: ReactNode }) {
  const tones = {
    info: "border-line bg-surface",
    warning: "border-sand bg-sand-soft",
    error: "border-error/40 bg-error-soft text-[#6d2416]",
    success: "border-forest/30 bg-forest-soft text-forest-deep",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-[14px] border px-4 py-3 text-[15px] ${tones[tone]}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-0.5" : ""}>{children}</div>
    </div>
  );
}

export function Stars({ value, size = 14, label }: { value: number; size?: number; label?: string }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={label ?? `${value} out of 5`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <path
            d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.8l-5.1 2.7 1.1-5.7-4.3-4 5.8-.7z"
            fill={i < full ? "var(--terracotta)" : "none"}
            stroke="var(--terracotta)"
            strokeWidth="1.3"
          />
        </svg>
      ))}
    </span>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[15px] font-medium">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-[13px] text-ink-soft">{hint}</p> : null}
      {error ? (
        <p className="text-[13px] font-medium text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "block min-h-11 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3.5 text-[16px] text-charcoal placeholder:text-ink-soft/70 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/25";

export function PageHeading({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h1 className="text-[36px] sm:text-[44px]">{title}</h1>
      {lead ? <p className="mt-3 text-[17px] text-ink-soft">{lead}</p> : null}
      {children}
    </div>
  );
}

export function Container({ children, className = "", narrow = false }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={`mx-auto w-full px-4 sm:px-6 ${narrow ? "max-w-3xl" : "max-w-6xl"} ${className}`}>{children}</div>;
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center">
      <p className="font-serif text-[24px]">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-ink-soft">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
