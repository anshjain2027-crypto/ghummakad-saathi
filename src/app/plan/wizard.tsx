"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Scene } from "@/components/scene";
import { Button, Chip, Illustrative, Notice, inputClass } from "@/components/ui";
import { COMPANIONS, DURATIONS, INTERESTS, MOODS, PACES, STYLES, travellerCountFor, type CompanionId, type MoodId, type PaceId, type StyleId } from "@/lib/domain";
import { CITIES, DISPLAY_CURRENCIES, formatMoney } from "@/lib/geo";
import { priceFor } from "@/lib/pricing";
import { findMatchesAction } from "@/app/actions/planner";
import type { Preferences } from "@/lib/planner/schema";

type State = {
  mood?: MoodId;
  companion?: CompanionId;
  travellers: number;
  style?: StyleId;
  pace: PaceId;
  origin: string;
  dateMode: "dates" | "month" | "flexible";
  startDate: string;
  month: number;
  days: number;
  budgetInr: number;
  budgetIncludesTransport: boolean;
  displayCurrency: string;
  interests: string[];
  accessibility: string;
  exclusions: string;
};

const STEPS = ["mood", "companions", "style", "where", "extras", "budget"] as const;
type Step = (typeof STEPS)[number];

const STYLE_SCENES: Record<StyleId, string> = { backpacking: "adventure", comfortable: "lake", luxury: "city", romantic: "beach", experience: "forest" };

function fromPrefs(p: Preferences | null, presetMood?: MoodId): State {
  const nextMonth = ((new Date().getMonth() + 1) % 12) + 1;
  return {
    mood: presetMood ?? p?.mood,
    companion: p?.companion,
    travellers: p?.travellers ?? 2,
    style: p?.style,
    pace: p?.pace ?? "balanced",
    origin: p?.origin ?? "",
    dateMode: p?.dateMode ?? "flexible",
    startDate: p?.startDate ?? "",
    month: p?.month ?? nextMonth,
    days: p?.days ?? 5,
    budgetInr: p?.budgetInr ?? 40000,
    budgetIncludesTransport: p?.budgetIncludesTransport ?? true,
    displayCurrency: p?.displayCurrency ?? "INR",
    interests: p?.interests ?? [],
    accessibility: p?.accessibility ?? "",
    exclusions: p?.exclusions ?? "",
  };
}

export function Wizard({ initial, presetMood, startAtSummary }: { initial: Preferences | null; presetMood?: MoodId; startAtSummary: boolean }) {
  const router = useRouter();
  const [s, setS] = useState<State>(() => fromPrefs(initial, presetMood));
  const [step, setStep] = useState<Step>(startAtSummary ? "budget" : presetMood ? "companions" : "mood");
  const [phase, setPhase] = useState<"asking" | "finding" | "error">("asking");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const idx = STEPS.indexOf(step);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((prev) => ({ ...prev, [k]: v }));
  const go = (to: Step) => setStep(to);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]);

  const canContinue: Record<Step, boolean> = {
    mood: !!s.mood,
    companions: !!s.companion && s.travellers >= 1 && s.travellers <= 30,
    style: !!s.style,
    where: s.origin.trim().length >= 2 && (s.dateMode !== "dates" || /^\d{4}-\d{2}-\d{2}$/.test(s.startDate)),
    extras: true,
    budget: s.budgetInr >= 5000 && s.days >= 2,
  };

  const city = CITIES.find((c) => c.name.toLowerCase() === s.origin.trim().toLowerCase());

  function submit() {
    const prefs = {
      mood: s.mood,
      companion: s.companion,
      travellers: s.travellers,
      style: s.style,
      pace: s.pace,
      origin: s.origin.trim(),
      originCityId: city?.id,
      dateMode: s.dateMode,
      startDate: s.dateMode === "dates" ? s.startDate : undefined,
      month: s.dateMode === "month" ? s.month : undefined,
      days: s.days,
      budgetInr: Math.round(s.budgetInr),
      budgetIncludesTransport: s.budgetIncludesTransport,
      displayCurrency: s.displayCurrency,
      interests: s.interests,
      accessibility: s.accessibility,
      exclusions: s.exclusions,
    };
    setPhase("finding");
    setError(null);
    const minWait = new Promise((r) => setTimeout(r, 2600));
    start(async () => {
      const [res] = await Promise.all([findMatchesAction(prefs), minWait]);
      if (res.ok) router.push("/plan/matches");
      else {
        setPhase("error");
        setError(res.error);
      }
    });
  }

  if (phase === "finding" || (phase === "error" && pending)) return <Finding mood={s.mood ?? "surprise"} />;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <Progress idx={idx} onBack={idx > 0 ? back : undefined} />

      {phase === "error" && error ? (
        <div className="mt-6">
          <Notice tone="error" title="Something went wrong">
            {error}{" "}
            <button className="font-semibold underline" onClick={submit}>
              Try again
            </button>
          </Notice>
        </div>
      ) : null}

      <section className="crossfade mt-8" key={step} aria-labelledby="q">
        {step === "mood" && (
          <>
            <Question refEl={headingRef}>What are you craving right now?</Question>
            <Choices label="Mood" cols="grid-cols-2 lg:grid-cols-3">
              {MOODS.map((m) => (
                <ImageChoice key={m.id} selected={s.mood === m.id} onSelect={() => set("mood", m.id)} title={m.label} line={m.line} scene={m.scene} seed={`mood-${m.id}`} />
              ))}
            </Choices>
          </>
        )}

        {step === "companions" && (
          <>
            <Question refEl={headingRef}>Who&rsquo;s coming along?</Question>
            <Choices label="Companions" cols="grid-cols-2 lg:grid-cols-4">
              {COMPANIONS.map((c) => (
                <GlyphChoice
                  key={c.id}
                  selected={s.companion === c.id}
                  onSelect={() => setS((prev) => ({ ...prev, companion: c.id, travellers: prev.companion === c.id ? prev.travellers : travellerCountFor(c.id) }))}
                  title={c.label}
                  line={c.line}
                  glyph={c.id}
                />
              ))}
            </Choices>
            {s.companion ? (
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-4">
                <span id="trav-label" className="text-[15px] font-medium">
                  How many travellers, including you?
                </span>
                <Stepper labelledBy="trav-label" value={s.travellers} min={1} max={30} onChange={(v) => set("travellers", v)} />
                <span className="text-[14px] text-ink-soft">
                  Trip plan for this group: <strong className="text-charcoal">₹{priceFor(s.travellers).amountInr}</strong> total
                  {s.travellers >= 5 ? " (5+ travellers)" : " (1–4 travellers)"}
                </span>
              </div>
            ) : null}
          </>
        )}

        {step === "style" && (
          <>
            <Question refEl={headingRef}>What kind of trip sounds right?</Question>
            <Choices label="Travel style" cols="grid-cols-2 lg:grid-cols-5">
              {STYLES.map((st) => (
                <ImageChoice key={st.id} selected={s.style === st.id} onSelect={() => set("style", st.id)} title={st.label} line={st.line} scene={STYLE_SCENES[st.id]} seed={`style-${st.id}`} compact />
              ))}
            </Choices>
            <p className="mt-5 min-h-6 text-[16px] text-forest" aria-live="polite">
              {s.style ? `${STYLES.find((x) => x.id === s.style)!.label}: ${STYLES.find((x) => x.id === s.style)!.line.charAt(0).toLowerCase()}${STYLES.find((x) => x.id === s.style)!.line.slice(1)}` : ""}
            </p>
            <fieldset className="mt-6">
              <legend className="text-[15px] font-medium">How full should the days be?</legend>
              <Segmented name="pace" value={s.pace} onChange={(v) => set("pace", v as PaceId)} options={PACES.map((p) => ({ value: p.id, label: p.label, hint: p.line }))} />
            </fieldset>
          </>
        )}

        {step === "where" && (
          <>
            <Question refEl={headingRef}>Where are you starting from, and when?</Question>
            <div className="mt-8 grid max-w-2xl gap-7">
              <div className="space-y-1.5">
                <label htmlFor="origin" className="block text-[15px] font-medium">
                  Departure city
                </label>
                <input id="origin" list="cities" className={inputClass} value={s.origin} onChange={(e) => set("origin", e.target.value)} placeholder="e.g. New Delhi, Bengaluru, London" autoComplete="address-level2" />
                <datalist id="cities">
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.country}
                    </option>
                  ))}
                </datalist>
                <p className="text-[13px] text-ink-soft">
                  {city ? `${city.country} · nearest airport ${city.iata}` : "Pick from the list for better travel estimates, or type any city."}
                </p>
              </div>
              <fieldset>
                <legend className="text-[15px] font-medium">When are you thinking?</legend>
                <Segmented
                  name="dateMode"
                  value={s.dateMode}
                  onChange={(v) => set("dateMode", v as State["dateMode"])}
                  options={[
                    { value: "dates", label: "Exact dates" },
                    { value: "month", label: "A month" },
                    { value: "flexible", label: "I'm flexible" },
                  ]}
                />
                {s.dateMode === "dates" ? (
                  <div className="mt-4 max-w-xs space-y-1.5">
                    <label htmlFor="start" className="block text-[14px]">
                      Start date
                    </label>
                    <input id="start" type="date" className={inputClass} value={s.startDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set("startDate", e.target.value)} />
                  </div>
                ) : null}
                {s.dateMode === "month" ? (
                  <div className="mt-4 max-w-xs space-y-1.5">
                    <label htmlFor="month" className="block text-[14px]">
                      Month
                    </label>
                    <select id="month" className={inputClass} value={s.month} onChange={(e) => set("month", Number(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {new Date(2026, i, 1).toLocaleString("en-IN", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </fieldset>
            </div>
          </>
        )}

        {step === "extras" && (
          <>
            <Question refEl={headingRef}>Anything we should plan around?</Question>
            <p className="mt-3 text-ink-soft">Optional. Skip if nothing comes to mind.</p>
            <fieldset className="mt-8">
              <legend className="text-[15px] font-medium">Things you&rsquo;d love</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                  const on = s.interests.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("interests", on ? s.interests.filter((x) => x !== i) : [...s.interests, i])}
                      className={`min-h-11 rounded-[var(--radius-chip)] border px-3.5 text-[15px] transition-colors ${on ? "border-forest bg-forest text-cream" : "border-line-strong bg-surface hover:border-forest"}`}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="mt-8 grid max-w-2xl gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="access" className="block text-[15px] font-medium">
                  Accessibility or comfort needs
                </label>
                <textarea id="access" rows={3} maxLength={300} className={`${inputClass} py-2.5`} value={s.accessibility} onChange={(e) => set("accessibility", e.target.value)} placeholder="e.g. avoid steep hikes, travelling with a toddler" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="excl" className="block text-[15px] font-medium">
                  Anything to avoid
                </label>
                <textarea id="excl" rows={3} maxLength={300} className={`${inputClass} py-2.5`} value={s.exclusions} onChange={(e) => set("exclusions", e.target.value)} placeholder="e.g. long road journeys, crowded places" />
              </div>
            </div>
          </>
        )}

        {step === "budget" && (
          <>
            <Question refEl={headingRef}>What should this trip work within?</Question>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-8">
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <label htmlFor="budget" className="text-[15px] font-medium">
                      Total trip budget for {s.travellers} {s.travellers === 1 ? "traveller" : "travellers"}
                    </label>
                    <select aria-label="Show amounts in" className="min-h-11 rounded-[10px] border border-line-strong bg-surface px-2 text-[14px]" value={s.displayCurrency} onChange={(e) => set("displayCurrency", e.target.value)}>
                      {DISPLAY_CURRENCIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <p className="nums mt-2 font-serif text-[44px] leading-none text-forest">{formatMoney(s.budgetInr, s.displayCurrency)}</p>
                  {s.displayCurrency !== "INR" ? <p className="mt-1 text-[13px] text-ink-soft">≈ ₹{s.budgetInr.toLocaleString("en-IN")} · indicative conversion, not a quote</p> : null}
                  <input id="budget" type="range" min={10000} max={1000000} step={5000} value={Math.min(s.budgetInr, 1000000)} onChange={(e) => set("budgetInr", Number(e.target.value))} className="mt-4 h-11 w-full accent-[var(--forest)]" aria-valuetext={`₹${s.budgetInr.toLocaleString("en-IN")}`} />
                  <div className="mt-2 flex items-center gap-3">
                    <label htmlFor="budgetExact" className="text-[14px] text-ink-soft">
                      Or type an amount in ₹
                    </label>
                    <input id="budgetExact" type="number" inputMode="numeric" min={5000} max={5000000} step={1000} className={`${inputClass} nums w-40`} value={s.budgetInr} onChange={(e) => set("budgetInr", Math.max(0, Number(e.target.value)))} />
                  </div>
                  <label className="mt-4 flex min-h-11 items-center gap-3 text-[15px]">
                    <input type="checkbox" checked={s.budgetIncludesTransport} onChange={(e) => set("budgetIncludesTransport", e.target.checked)} className="h-5 w-5 accent-[var(--forest)]" />
                    This includes getting there and back
                  </label>
                  <p className="text-[13px] text-ink-soft">Stays, food, local travel and activities are always included in our estimate.</p>
                </div>
                <fieldset>
                  <legend className="text-[15px] font-medium">How long?</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DURATIONS.map((d) => {
                      const on = d.id === "3-4" ? s.days <= 4 : d.id === "5-6" ? s.days === 5 || s.days === 6 : s.days >= 7;
                      return (
                        <button key={d.id} type="button" aria-pressed={on} onClick={() => set("days", d.days)} className={`min-h-11 rounded-[var(--radius-control)] border px-4 text-[15px] ${on ? "border-forest bg-forest text-cream" : "border-line-strong bg-surface hover:border-forest"}`}>
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span id="days-label" className="text-[14px] text-ink-soft">
                      Exactly
                    </span>
                    <Stepper labelledBy="days-label" value={s.days} min={2} max={14} onChange={(v) => set("days", v)} suffix="days" />
                  </div>
                </fieldset>
              </div>
              <aside className="h-fit rounded-[var(--radius-card)] border border-line bg-surface p-6">
                <p className="font-serif text-[22px]">Your trip so far</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.mood ? <Chip tone="forest">{MOODS.find((m) => m.id === s.mood)!.label}</Chip> : null}
                  {s.companion ? <Chip>{COMPANIONS.find((c) => c.id === s.companion)!.label} · {s.travellers}</Chip> : null}
                  {s.style ? <Chip>{STYLES.find((x) => x.id === s.style)!.label}</Chip> : null}
                  <Chip>{PACES.find((p) => p.id === s.pace)!.label} pace</Chip>
                  {s.origin ? <Chip tone="plain">From {s.origin}</Chip> : null}
                  <Chip tone="plain">{s.days} days</Chip>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
                  {(["mood", "companions", "style", "where"] as Step[]).map((st) => (
                    <button key={st} type="button" className="text-forest underline-offset-4 hover:underline" onClick={() => go(st)}>
                      Edit {st === "where" ? "start & dates" : st}
                    </button>
                  ))}
                </div>
                <Illustrative className="mt-6" />
              </aside>
            </div>
          </>
        )}
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 mt-10 flex items-center justify-between gap-3 border-t border-line bg-cream/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        {idx > 0 ? (
          <Button variant="ghost" onClick={back} type="button">
            Back
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {step === "extras" ? (
            <Button variant="ghost" type="button" onClick={next}>
              Skip
            </Button>
          ) : null}
          {step === "budget" ? (
            <Button type="button" disabled={!canContinue.budget || pending} onClick={submit} className="min-w-44">
              Show my matches
            </Button>
          ) : (
            <Button type="button" disabled={!canContinue[step]} onClick={next} className="min-w-36">
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Progress({ idx, onBack }: { idx: number; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-4">
      {onBack ? (
        <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface hover:border-forest" aria-label="Back to previous question">
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
            <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
      <div className="flex-1">
        <p className="text-[14px] text-ink-soft">
          Question {idx + 1} of {STEPS.length}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={idx + 1} aria-label="Progress">
          <div className="h-full rounded-full bg-terracotta transition-[width] duration-300" style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function Question({ children, refEl }: { children: React.ReactNode; refEl: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <h1 id="q" ref={refEl} tabIndex={-1} className="max-w-3xl text-[36px] outline-none sm:text-[52px]">
      {children}
    </h1>
  );
}

function Choices({ label, cols, children }: { label: string; cols: string; children: React.ReactNode }) {
  return (
    <div role="radiogroup" aria-label={label} className={`mt-8 grid gap-3 sm:gap-4 ${cols}`}>
      {children}
    </div>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border-2 transition-all duration-200 ${on ? "scale-100 border-forest bg-forest text-cream" : "scale-90 border-cream/80 bg-black/10 text-transparent"}`} aria-hidden>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ImageChoice({ selected, onSelect, title, line, scene, seed, compact }: { selected: boolean; onSelect: () => void; title: string; line: string; scene: string; seed: string; compact?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`lift group relative overflow-hidden rounded-[var(--radius-card)] bg-surface text-left outline-offset-4 ring-forest ${selected ? "ring-[3px]" : "ring-0"}`}
    >
      <Scene kind={scene} seed={seed} label="" className={compact ? "aspect-[4/5]" : "aspect-[4/3] sm:aspect-[5/4]"} />
      <Check on={selected} />
      <span className="block px-4 pb-4 pt-3">
        <span className={`block font-serif leading-tight ${compact ? "text-[19px]" : "text-[22px]"}`}>{title}</span>
        <span className="mt-1 block text-[14px] text-ink-soft">{line}</span>
      </span>
    </button>
  );
}

function Glyph({ kind }: { kind: CompanionId }) {
  const person = (x: number, s = 1, c = "var(--forest)") => (
    <g key={x} transform={`translate(${x} ${60 - 60 * s + 8}) scale(${s})`} fill={c}>
      <circle cx="20" cy="18" r="10" />
      <path d="M4 62c0-12 7-24 16-24s16 12 16 24z" />
    </g>
  );
  const sets: Record<CompanionId, React.ReactNode[]> = {
    solo: [person(50)],
    partner: [person(34), person(64, 1, "var(--terracotta)")],
    friends: [person(18), person(50, 1, "var(--terracotta)"), person(82, 1, "#5e8a77")],
    family: [person(20), person(56, 1, "var(--terracotta)"), person(88, 0.7, "#5e8a77")],
  };
  return (
    <svg viewBox="0 0 140 76" className="h-20 w-auto" aria-hidden>
      <ellipse cx="70" cy="72" rx="62" ry="4" fill="var(--sand)" opacity="0.5" />
      {sets[kind]}
    </svg>
  );
}

function GlyphChoice({ selected, onSelect, title, line, glyph }: { selected: boolean; onSelect: () => void; title: string; line: string; glyph: CompanionId }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`lift relative flex min-h-48 flex-col justify-between rounded-[var(--radius-card)] border bg-surface p-5 text-left ${selected ? "border-forest ring-[3px] ring-forest" : "border-line"}`}
    >
      <span className="grid place-items-center rounded-[12px] bg-cream py-4">
        <Glyph kind={glyph} />
      </span>
      <span className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border-2 ${selected ? "border-forest bg-forest text-cream" : "border-line-strong text-transparent"}`} aria-hidden>
        <svg width="14" height="14" viewBox="0 0 16 16">
          <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="mt-4 block">
        <span className="block font-serif text-[22px]">{title}</span>
        <span className="mt-1 block text-[14px] text-ink-soft">{line}</span>
      </span>
    </button>
  );
}

function Segmented({ name, value, onChange, options }: { name: string; value: string; onChange: (v: string) => void; options: { value: string; label: string; hint?: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 rounded-[var(--radius-control)] border px-4 py-2 text-left text-[15px] ${value === o.value ? "border-forest bg-forest text-cream" : "border-line-strong bg-surface hover:border-forest"}`}
        >
          <span className="block font-medium">{o.label}</span>
          {o.hint ? <span className={`block text-[13px] ${value === o.value ? "text-cream/80" : "text-ink-soft"}`}>{o.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, min, max, onChange, labelledBy, suffix }: { value: number; min: number; max: number; onChange: (v: number) => void; labelledBy: string; suffix?: string }) {
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-labelledby={labelledBy}>
      <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-[20px] disabled:opacity-40" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease">
        −
      </button>
      <output className="nums min-w-14 text-center text-[18px] font-semibold" aria-live="polite">
        {value}
        {suffix ? <span className="ml-1 text-[14px] font-normal text-ink-soft">{suffix}</span> : null}
      </output>
      <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-surface text-[20px] disabled:opacity-40" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase">
        +
      </button>
    </div>
  );
}

/** DESIGN.md screen 6 — legible matching, no fake percentages or countdowns. */
function Finding({ mood }: { mood: MoodId }) {
  const signals = useMemo(() => ["Your mood", "Your travel style", "Your budget and pace"], []);
  const scene = MOODS.find((m) => m.id === mood)?.scene ?? "lake";
  return (
    <div className="on-dark relative isolate grid min-h-[78vh] place-items-center overflow-hidden bg-forest-deep text-cream" role="status" aria-live="polite">
      <Scene kind={scene} seed="finding" label="" className="absolute inset-0 -z-10 scale-105 opacity-70" />
      <div className="absolute inset-0 -z-10 bg-[#0f2a23]/55" />
      <div className="px-6 text-center">
        <p className="font-serif text-[30px] leading-tight sm:text-[44px]">Finding places that fit your mood, budget and pace…</p>
        <ul className="mx-auto mt-8 flex max-w-md flex-col gap-3 text-[17px]">
          {signals.map((sig, i) => (
            <li key={sig} className="signal flex items-center justify-center gap-3" style={{ animationDelay: `${300 + i * 650}ms` }}>
              <span className="h-2 w-2 rounded-full bg-sand" aria-hidden />
              {sig}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
