import "server-only";
import { config } from "@/lib/config";
import { findCity } from "@/lib/geo";
import type { Destination } from "@/lib/planner/types";
import type { Preferences } from "@/lib/planner/schema";

/**
 * BookingProviderAdapter contract. Without partner credentials every adapter
 * returns honest outbound search links (status "redirect") or curated
 * guidance (status "mock"). No adapter ever returns fabricated inventory,
 * live prices or booking confirmations.
 */

export type AdapterStatus = "mock" | "redirect" | "approved_api" | "disabled";
export type BookingCategory = "stay" | "flight" | "train" | "activity" | "vehicle";

export type BookingOption = {
  provider: string;
  providerLabel: string;
  category: BookingCategory;
  status: AdapterStatus;
  title: string;
  rationale: string;
  priceType: "none" | "indicative" | "live";
  priceText: string | null;
  lastChecked: string | null;
  missingData: string | null;
  url: string | null;
  cta: string;
  isAffiliate: boolean;
};

export interface BookingProviderAdapter {
  id: string;
  label: string;
  category: BookingCategory;
  status(): AdapterStatus;
  options(ctx: BookingContext): BookingOption[];
}

export type BookingContext = { dest: Destination; prefs: Preferences; startDate: string | null; endDate: string | null };

function dates(prefs: Preferences): { start: string | null; end: string | null } {
  if (prefs.dateMode !== "dates" || !prefs.startDate) return { start: null, end: null };
  const start = new Date(`${prefs.startDate}T00:00:00Z`);
  const end = new Date(start.getTime() + prefs.days * 86_400_000);
  return { start: prefs.startDate, end: end.toISOString().slice(0, 10) };
}

export function bookingContext(dest: Destination, prefs: Preferences): BookingContext {
  const d = dates(prefs);
  return { dest, prefs, startDate: d.start, endDate: d.end };
}

const NO_DATES = "Add exact travel dates to your trip to pre-fill dates on the provider's site.";

const bookingCom: BookingProviderAdapter = {
  id: "booking_com",
  label: "Booking.com",
  category: "stay",
  status: () => "redirect",
  options: ({ dest, prefs, startDate, endDate }) => {
    const u = new URL("https://www.booking.com/searchresults.html");
    u.searchParams.set("ss", `${dest.name}, ${dest.country}`);
    u.searchParams.set("group_adults", String(prefs.travellers));
    u.searchParams.set("no_rooms", String(Math.max(1, Math.ceil(prefs.travellers / 2))));
    if (startDate && endDate) {
      u.searchParams.set("checkin", startDate);
      u.searchParams.set("checkout", endDate);
    }
    if (config.affiliates.booking) u.searchParams.set("aid", config.affiliates.booking);
    return [
      {
        provider: "booking_com",
        providerLabel: "Booking.com",
        category: "stay",
        status: "redirect",
        title: `Stays in ${dest.stayArea.split(";")[0].replace(/ for .*/, "")}`,
        rationale: `Search starts with the area we suggest: ${dest.stayArea}`,
        priceType: "none",
        priceText: null,
        lastChecked: null,
        missingData: startDate ? "Prices and availability are shown on Booking.com." : NO_DATES,
        url: u.toString(),
        cta: "Check availability with Booking.com",
        isAffiliate: !!config.affiliates.booking,
      },
    ];
  },
};

function flightOption(provider: "kayak" | "skyscanner", ctx: BookingContext): BookingOption | null {
  const origin = findCity(ctx.prefs.originCityId) ?? findCity(ctx.prefs.origin);
  const to = ctx.dest.nearestAirport;
  if (!origin || !to || origin.iata === to) return null;
  let url: string;
  if (provider === "kayak") {
    const path = ctx.startDate && ctx.endDate ? `${origin.iata}-${to}/${ctx.startDate}/${ctx.endDate}` : `${origin.iata}-${to}`;
    const u = new URL(`https://www.kayak.co.in/flights/${path}`);
    if (ctx.prefs.travellers > 1) u.pathname += `/${ctx.prefs.travellers}adults`;
    if (config.affiliates.kayak) u.searchParams.set("a", config.affiliates.kayak);
    url = u.toString();
  } else {
    const ymd = (s: string) => s.slice(2).replaceAll("-", "");
    const datePath = ctx.startDate && ctx.endDate ? `${ymd(ctx.startDate)}/${ymd(ctx.endDate)}/` : "";
    const u = new URL(
      `https://www.skyscanner.co.in/transport/flights/${origin.iata.toLowerCase()}/${to.toLowerCase()}/${datePath}`,
    );
    u.searchParams.set("adultsv2", String(ctx.prefs.travellers));
    if (config.affiliates.skyscanner) u.searchParams.set("associateid", config.affiliates.skyscanner);
    url = u.toString();
  }
  return {
    provider,
    providerLabel: provider === "kayak" ? "KAYAK" : "Skyscanner",
    category: "flight",
    status: "redirect",
    title: `${origin.name} (${origin.iata}) → ${to}`,
    rationale:
      provider === "kayak"
        ? "Compare fares across airlines. We'd weigh total price, duration, stops, baggage and refund rules — not just the cheapest fare."
        : "A second comparison to cross-check fares.",
    priceType: "none",
    priceText: null,
    lastChecked: null,
    missingData: ctx.startDate ? "Live fares are shown on the provider's site." : NO_DATES,
    url,
    cta: `Check availability with ${provider === "kayak" ? "KAYAK" : "Skyscanner"}`,
    isAffiliate: provider === "kayak" ? !!config.affiliates.kayak : !!config.affiliates.skyscanner,
  };
}

const kayak: BookingProviderAdapter = {
  id: "kayak",
  label: "KAYAK",
  category: "flight",
  status: () => "redirect",
  options: (ctx) => [flightOption("kayak", ctx)].filter((x): x is BookingOption => !!x),
};
const skyscanner: BookingProviderAdapter = {
  id: "skyscanner",
  label: "Skyscanner",
  category: "flight",
  status: () => "redirect",
  options: (ctx) => [flightOption("skyscanner", ctx)].filter((x): x is BookingOption => !!x),
};

const irctc: BookingProviderAdapter = {
  id: "irctc",
  label: "IRCTC",
  category: "train",
  status: () => "redirect",
  options: ({ dest }) =>
    dest.countryCode !== "IN" || !dest.nearestRail
      ? []
      : [
          {
            provider: "irctc",
            providerLabel: "IRCTC",
            category: "train",
            status: "redirect",
            title: `Trains towards ${dest.nearestRail}`,
            rationale: "Indian Railways tickets are booked on the official IRCTC website or app.",
            priceType: "none",
            priceText: null,
            lastChecked: null,
            missingData: "We don't show train numbers, timetables or availability. Search on IRCTC for current options.",
            url: "https://www.irctc.co.in/nget/train-search",
            cta: "Check availability with IRCTC",
            isAffiliate: false,
          },
        ],
};

const events: BookingProviderAdapter = {
  id: "events",
  label: "District / BookMyShow",
  category: "activity",
  status: () => "redirect",
  options: ({ dest }) =>
    dest.countryCode !== "IN"
      ? []
      : [
          {
            provider: "district",
            providerLabel: "District",
            category: "activity",
            status: "redirect",
            title: "Events and dining out",
            rationale: "Useful in bigger towns for events and restaurant bookings. Coverage in small valleys is limited.",
            priceType: "none",
            priceText: null,
            lastChecked: null,
            missingData: "Listings depend on the city; we don't verify them.",
            url: "https://www.district.in/",
            cta: "Check availability with District",
            isAffiliate: false,
          },
          {
            provider: "bookmyshow",
            providerLabel: "BookMyShow",
            category: "activity",
            status: "redirect",
            title: "Shows and experiences",
            rationale: "Concerts, plays and experiences where available.",
            priceType: "none",
            priceText: null,
            lastChecked: null,
            missingData: "Listings depend on the city; we don't verify them.",
            url: "https://in.bookmyshow.com/",
            cta: "Check availability with BookMyShow",
            isAffiliate: false,
          },
        ],
};

const localVehicle: BookingProviderAdapter = {
  id: "local_vehicle",
  label: "Local rentals",
  category: "vehicle",
  status: () => "mock",
  options: ({ dest }) => [
    {
      provider: "local_vehicle",
      providerLabel: "Local tip",
      category: "vehicle",
      status: "mock",
      title: "Two-wheeler or car hire",
      rationale: `In ${dest.name}, your stay can usually recommend a licensed local operator. Ask for documents, helmets and insurance.`,
      priceType: "none",
      priceText: null,
      lastChecked: null,
      missingData: "We don't have a verified rental partner here yet, so availability isn't checked.",
      url: null,
      cta: "Ask your stay",
      isAffiliate: false,
    },
  ],
};

export const ADAPTERS: BookingProviderAdapter[] = [bookingCom, kayak, skyscanner, irctc, events, localVehicle];

export function bookingOptions(dest: Destination, prefs: Preferences): Record<BookingCategory, BookingOption[]> {
  const ctx = bookingContext(dest, prefs);
  const out: Record<BookingCategory, BookingOption[]> = { stay: [], flight: [], train: [], activity: [], vehicle: [] };
  for (const a of ADAPTERS) {
    if (a.status() === "disabled") continue;
    for (const o of a.options(ctx)) out[o.category].push(o);
  }
  return out;
}
