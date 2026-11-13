/**
 * One editorial line per month on India's weather, used on /where-to-go/[month].
 * Kept general on purpose: destination-level detail comes from each destination's
 * own bestMonths and seasonNote fields.
 */
export const MONTH_INTRO: Record<number, { headline: string; summary: string; watch: string }> = {
  1: {
    headline: "Peak season in the plains, deep winter in the mountains",
    summary: "Clear, cool days make January one of the best months for Rajasthan, the Golden Triangle, Varanasi, Goa, Kerala and Tamil Nadu.",
    watch: "Dense fog often delays morning trains and flights in north India, and high Himalayan roads are snowed in.",
  },
  2: {
    headline: "Warm days, cool nights, fewer crowds than December",
    summary: "February is a sweet spot: still pleasant almost everywhere in the plains and the south, with the desert at its best.",
    watch: "The high Himalaya is still in winter; treks and passes above about 3,000 m are mostly closed.",
  },
  3: {
    headline: "Spring, Holi and the last cool weeks in the plains",
    summary: "Early March is still comfortable for Rajasthan and the south. Hill stations and lower Himalayan treks start opening up.",
    watch: "The plains warm up quickly through late March. Holi (usually March) is joyful but crowded.",
  },
  4: {
    headline: "Head for the hills",
    summary: "April belongs to the mountains: Himachal, Uttarakhand, Darjeeling and Sikkim have clear skies and rhododendrons in bloom.",
    watch: "Temperatures in the northern and central plains often pass 38°C. Plan city sightseeing for early mornings.",
  },
  5: {
    headline: "Hill stations and high valleys",
    summary: "May is for the hills and the first high-altitude trips, while the plains are at their hottest.",
    watch: "Indian school holidays fill hill stations, so book stays and transport early.",
  },
  6: {
    headline: "The monsoon arrives, and the high desert opens",
    summary: "June opens the high Himalaya: Ladakh and, later, Spiti become reachable by road, and the first monsoon rain turns the south and west green.",
    watch: "The west coast and Kerala get heavy rain from early June; beaches are rough and many shacks close.",
  },
  7: {
    headline: "Monsoon India: go high or go green",
    summary: "July is the best time for Ladakh and Spiti, which sit in the Himalayan rain shadow. Elsewhere it's lush green countryside in heavy bursts of rain.",
    watch: "Landslides can close mountain roads in Himachal, Uttarakhand and the north-east. Build in buffer days.",
  },
  8: {
    headline: "Rain-shadow deserts and waterfall country",
    summary: "August is still prime time for Ladakh and Spiti, and the Western Ghats are at their most dramatic with waterfalls everywhere.",
    watch: "Monsoon rain continues across most of India; check road conditions daily in the mountains.",
  },
  9: {
    headline: "The tail of the monsoon",
    summary: "September is the last good month for Ladakh and Spiti, and a quiet, green, good-value time elsewhere as the rain eases.",
    watch: "Rain can linger into late September, especially in the south and east.",
  },
  10: {
    headline: "High season begins",
    summary: "October brings clear skies and green landscapes after the monsoon: great for Rajasthan, the Himalayan foothills, Darjeeling and Sikkim.",
    watch: "Diwali often falls in late October or November; trains and hotels sell out around it.",
  },
  11: {
    headline: "Clear skies almost everywhere",
    summary: "November is one of India's best months: pleasant in Rajasthan and Varanasi, crisp and clear in the hills, and the start of beach season in Goa and Kerala.",
    watch: "Delhi's air quality is often poor in November; spend fewer days in the capital.",
  },
  12: {
    headline: "Beach season and festive cities",
    summary: "December is peak season for Goa, Kerala and the desert, with warm days and cool nights across the plains.",
    watch: "Prices can double around Christmas and New Year, and fog disrupts north Indian travel from mid-December.",
  },
};
