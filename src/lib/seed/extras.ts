import type { DestinationExtra } from "@/lib/planner/types";

/** Travel access + photo titles for the original catalogue entries. */
export const DESTINATION_EXTRAS: Record<string, DestinationExtra> = {
  "tirthan-valley": { access: { airport: "KUU", hilly: true, busHint: "overnight bus to Aut, then local bus or cab", startPoint: "Gushaini" }, photoTitle: "Tirthan Valley", idealTrip: "4D/3N" },
  gokarna: { access: { airport: "GOI", rail: "GOK" }, photoTitle: "Gokarna, Karnataka", idealTrip: "3D/2N" },
  "ziro-valley": { access: { airport: "IXI", rail: "NLP", hilly: true }, photoTitle: "Ziro", idealTrip: "5D/4N" },
  hampi: { access: { airport: "VDY", rail: "HPT" }, photoTitle: "Hampi", idealTrip: "3D/2N" },
  "spiti-valley": { access: { airport: "KUU", hilly: true, busHint: "HRTC bus via Shimla or Manali" }, photoTitle: "Spiti Valley", idealTrip: "8D/7N" },
  varkala: { access: { airport: "TRV", rail: "VAK" }, photoTitle: "Varkala Beach", idealTrip: "3D/2N" },
  coorg: { access: { airport: "MYQ", rail: "MYS", hilly: true }, photoTitle: "Kodagu district", idealTrip: "3D/2N" },
  udaipur: { access: { airport: "UDR", rail: "UDZ" }, photoTitle: "Udaipur", idealTrip: "3D/2N" },
  "sohra-meghalaya": { access: { airport: "SHL", rail: "GHY", hilly: true }, photoTitle: "Sohra", idealTrip: "4D/3N" },
  rishikesh: { access: { airport: "DED", rail: "YNRK", busHint: "ISBT Kashmere Gate to Rishikesh" }, photoTitle: "Rishikesh", idealTrip: "2D/1N weekend" },
  puducherry: { access: { airport: "MAA", rail: "PDY" }, photoTitle: "Puducherry", idealTrip: "2D/1N weekend" },
  kyoto: { access: { airport: "KIX", island: true }, photoTitle: "Kyoto" },
  lisbon: { access: { airport: "LIS", island: true }, photoTitle: "Lisbon" },
  ubud: { access: { airport: "DPS", island: true }, photoTitle: "Ubud" },
  "hoi-an": { access: { airport: "DAD", island: true }, photoTitle: "Hội An" },
  kazbegi: { access: { airport: "TBS", island: true }, photoTitle: "Stepantsminda" },
  ella: { access: { airport: "CMB", island: true }, photoTitle: "Ella, Sri Lanka" },
  interlaken: { access: { airport: "ZRH", island: true }, photoTitle: "Interlaken" },
};
