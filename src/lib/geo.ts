/** Region-aware departure cities and simple geographic helpers. Client-safe. */

export type City = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  iata: string;
  /** Main railway station code (India only), see src/lib/travel/hubs.ts. */
  rail?: string;
  currency: string;
  timezone: string;
};

export const CITIES: City[] = [
  { id: "delhi", name: "New Delhi", country: "India", countryCode: "IN", lat: 28.6139, lng: 77.209, iata: "DEL", rail: "NDLS", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "mumbai", name: "Mumbai", country: "India", countryCode: "IN", lat: 19.076, lng: 72.8777, iata: "BOM", rail: "CSMT", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "bengaluru", name: "Bengaluru", country: "India", countryCode: "IN", lat: 12.9716, lng: 77.5946, iata: "BLR", rail: "SBC", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "chennai", name: "Chennai", country: "India", countryCode: "IN", lat: 13.0827, lng: 80.2707, iata: "MAA", rail: "MAS", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "kolkata", name: "Kolkata", country: "India", countryCode: "IN", lat: 22.5726, lng: 88.3639, iata: "CCU", rail: "HWH", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "hyderabad", name: "Hyderabad", country: "India", countryCode: "IN", lat: 17.385, lng: 78.4867, iata: "HYD", rail: "SC", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "pune", name: "Pune", country: "India", countryCode: "IN", lat: 18.5204, lng: 73.8567, iata: "PNQ", rail: "PUNE", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "ahmedabad", name: "Ahmedabad", country: "India", countryCode: "IN", lat: 23.0225, lng: 72.5714, iata: "AMD", rail: "ADI", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "jaipur", name: "Jaipur", country: "India", countryCode: "IN", lat: 26.9124, lng: 75.7873, iata: "JAI", rail: "JP", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "chandigarh", name: "Chandigarh", country: "India", countryCode: "IN", lat: 30.7333, lng: 76.7794, iata: "IXC", rail: "CDG", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "lucknow", name: "Lucknow", country: "India", countryCode: "IN", lat: 26.8467, lng: 80.9462, iata: "LKO", rail: "LKO", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "kochi", name: "Kochi", country: "India", countryCode: "IN", lat: 9.9312, lng: 76.2673, iata: "COK", rail: "ERS", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "guwahati", name: "Guwahati", country: "India", countryCode: "IN", lat: 26.1445, lng: 91.7362, iata: "GAU", rail: "GHY", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "goa", name: "Goa", country: "India", countryCode: "IN", lat: 15.2993, lng: 74.124, iata: "GOI", rail: "MAO", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "dehradun", name: "Dehradun", country: "India", countryCode: "IN", lat: 30.3165, lng: 78.0322, iata: "DED", rail: "DDN", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "amritsar", name: "Amritsar", country: "India", countryCode: "IN", lat: 31.634, lng: 74.8723, iata: "ATQ", rail: "ASR", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "bhopal", name: "Bhopal", country: "India", countryCode: "IN", lat: 23.2599, lng: 77.4126, iata: "BHO", rail: "BPL", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "indore", name: "Indore", country: "India", countryCode: "IN", lat: 22.7196, lng: 75.8577, iata: "IDR", rail: "INDB", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "nagpur", name: "Nagpur", country: "India", countryCode: "IN", lat: 21.1458, lng: 79.0882, iata: "NAG", rail: "NGP", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "surat", name: "Surat", country: "India", countryCode: "IN", lat: 21.1702, lng: 72.8311, iata: "STV", rail: "ST", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "vadodara", name: "Vadodara", country: "India", countryCode: "IN", lat: 22.3072, lng: 73.1812, iata: "BDQ", rail: "BRC", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "coimbatore", name: "Coimbatore", country: "India", countryCode: "IN", lat: 11.0168, lng: 76.9558, iata: "CJB", rail: "CBE", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "mysuru", name: "Mysuru", country: "India", countryCode: "IN", lat: 12.2958, lng: 76.6394, iata: "MYQ", rail: "MYS", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "mangaluru", name: "Mangaluru", country: "India", countryCode: "IN", lat: 12.9141, lng: 74.856, iata: "IXE", rail: "MAQ", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "thiruvananthapuram", name: "Thiruvananthapuram", country: "India", countryCode: "IN", lat: 8.5241, lng: 76.9366, iata: "TRV", rail: "TVC", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "madurai", name: "Madurai", country: "India", countryCode: "IN", lat: 9.9252, lng: 78.1198, iata: "IXM", rail: "MDU", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "visakhapatnam", name: "Visakhapatnam", country: "India", countryCode: "IN", lat: 17.6868, lng: 83.2185, iata: "VTZ", rail: "VSKP", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "bhubaneswar", name: "Bhubaneswar", country: "India", countryCode: "IN", lat: 20.2961, lng: 85.8245, iata: "BBI", rail: "BBS", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "patna", name: "Patna", country: "India", countryCode: "IN", lat: 25.5941, lng: 85.1376, iata: "PAT", rail: "PNBE", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "varanasi", name: "Varanasi", country: "India", countryCode: "IN", lat: 25.3176, lng: 82.9739, iata: "VNS", rail: "BSB", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "udaipur", name: "Udaipur", country: "India", countryCode: "IN", lat: 24.5854, lng: 73.7125, iata: "UDR", rail: "UDZ", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "jodhpur", name: "Jodhpur", country: "India", countryCode: "IN", lat: 26.2389, lng: 73.0243, iata: "JDH", rail: "JU", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "jammu", name: "Jammu", country: "India", countryCode: "IN", lat: 32.7266, lng: 74.857, iata: "IXJ", rail: "JAT", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "siliguri", name: "Siliguri", country: "India", countryCode: "IN", lat: 26.7271, lng: 88.3953, iata: "IXB", rail: "NJP", currency: "INR", timezone: "Asia/Kolkata" },
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lng: 55.2708, iata: "DXB", currency: "AED", timezone: "Asia/Dubai" },
  { id: "singapore", name: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198, iata: "SIN", currency: "SGD", timezone: "Asia/Singapore" },
  { id: "bangkok", name: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lng: 100.5018, iata: "BKK", currency: "THB", timezone: "Asia/Bangkok" },
  { id: "kuala-lumpur", name: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", lat: 3.139, lng: 101.6869, iata: "KUL", currency: "MYR", timezone: "Asia/Kuala_Lumpur" },
  { id: "tokyo", name: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lng: 139.6503, iata: "HND", currency: "JPY", timezone: "Asia/Tokyo" },
  { id: "seoul", name: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lng: 126.978, iata: "ICN", currency: "KRW", timezone: "Asia/Seoul" },
  { id: "sydney", name: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lng: 151.2093, iata: "SYD", currency: "AUD", timezone: "Australia/Sydney" },
  { id: "melbourne", name: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.8136, lng: 144.9631, iata: "MEL", currency: "AUD", timezone: "Australia/Melbourne" },
  { id: "london", name: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5072, lng: -0.1276, iata: "LHR", currency: "GBP", timezone: "Europe/London" },
  { id: "paris", name: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522, iata: "CDG", currency: "EUR", timezone: "Europe/Paris" },
  { id: "berlin", name: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lng: 13.405, iata: "BER", currency: "EUR", timezone: "Europe/Berlin" },
  { id: "amsterdam", name: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3676, lng: 4.9041, iata: "AMS", currency: "EUR", timezone: "Europe/Amsterdam" },
  { id: "new-york", name: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.006, iata: "JFK", currency: "USD", timezone: "America/New_York" },
  { id: "san-francisco", name: "San Francisco", country: "United States", countryCode: "US", lat: 37.7749, lng: -122.4194, iata: "SFO", currency: "USD", timezone: "America/Los_Angeles" },
  { id: "toronto", name: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6532, lng: -79.3832, iata: "YYZ", currency: "CAD", timezone: "America/Toronto" },
  { id: "nairobi", name: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.2921, lng: 36.8219, iata: "NBO", currency: "KES", timezone: "Africa/Nairobi" },
  { id: "kathmandu", name: "Kathmandu", country: "Nepal", countryCode: "NP", lat: 27.7172, lng: 85.324, iata: "KTM", currency: "NPR", timezone: "Asia/Kathmandu" },
  { id: "colombo", name: "Colombo", country: "Sri Lanka", countryCode: "LK", lat: 6.9271, lng: 79.8612, iata: "CMB", currency: "LKR", timezone: "Asia/Colombo" },
];

/**
 * Indicative display rates (units of currency per 1 INR), for showing budgets
 * in a familiar currency ONLY. Not a quote; checkout is always in INR.
 */
export const INDICATIVE_RATES_PER_INR: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  SGD: 0.016,
  AUD: 0.018,
  CAD: 0.016,
  JPY: 1.8,
  THB: 0.41,
  MYR: 0.054,
  KRW: 16.5,
  NPR: 1.6,
  LKR: 3.6,
  KES: 1.55,
};

export const DISPLAY_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY"] as const;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Illustrative round-trip transport estimate per person, INR, by straight-line
 * distance. Deliberately coarse; always labelled as an estimate in the UI.
 */
export function transportEstimatePerPersonInr(distanceKm: number): [number, number] {
  if (distanceKm < 300) return [1000, 2500];
  if (distanceKm < 800) return [2500, 6000];
  if (distanceKm < 1500) return [5000, 11000];
  if (distanceKm < 3000) return [8000, 18000];
  if (distanceKm < 6000) return [22000, 40000];
  if (distanceKm < 9000) return [40000, 70000];
  return [60000, 110000];
}

export function findCity(idOrName: string | undefined): City | undefined {
  if (!idOrName) return undefined;
  const q = idOrName.trim().toLowerCase();
  return CITIES.find((c) => c.id === q || c.name.toLowerCase() === q);
}

export function formatMoney(amountInr: number, currency = "INR", locale = "en-IN"): string {
  const rate = INDICATIVE_RATES_PER_INR[currency] ?? 1;
  const value = currency === "INR" ? amountInr : amountInr * rate;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: rate === 1 && currency !== "INR" ? "INR" : currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}
