/** Public base URL. Falls back to the live domain on Vercel so robots, sitemap and canonical tags never point Google at localhost. */
export const SITE_URL = (
  process.env.APP_URL ?? (process.env.VERCEL ? "https://ghummakadsaathi.online" : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Ghummakad Saathi";
