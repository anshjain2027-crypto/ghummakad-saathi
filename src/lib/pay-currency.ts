import "server-only";
import { cookies, headers } from "next/headers";
import { isPayCurrency, type PayCurrency } from "@/lib/pricing";

export const PAY_CURRENCY_COOKIE = "gs_cur";

/**
 * Which price list to show and charge: the visitor's own choice if they
 * switched, otherwise USD for visitors outside India (by Vercel's IP country)
 * and INR in India or when the country is unknown.
 */
export async function payCurrency(): Promise<PayCurrency> {
  const c = (await cookies()).get(PAY_CURRENCY_COOKIE)?.value;
  if (isPayCurrency(c)) return c;
  const country = (await headers()).get("x-vercel-ip-country");
  return country && country.toUpperCase() !== "IN" ? "USD" : "INR";
}
