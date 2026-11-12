import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: "Ghummakad Saathi India trip planner",
      url: SITE_URL,
      inLanguage: "en-IN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

/** Microsoft Clarity (analytics). Set NEXT_PUBLIC_CLARITY_ID in Vercel to enable. */
const CLARITY_ID = /^[a-z0-9]{6,20}$/i.test(process.env.NEXT_PUBLIC_CLARITY_ID ?? "") ? process.env.NEXT_PUBLIC_CLARITY_ID : null;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ghummakad Saathi — Personalised India trip planner",
    template: "%s · Ghummakad Saathi — India trip planner",
  },
  description:
    "Plan your India trip in minutes. Tell us your mood, budget and dates and get matched destinations — Himalayan treks, Rajasthan forts, Kerala backwaters, Goa beaches — with a day-by-day itinerary, train, bus and flight options, and real costs. From $10 (₹499 in India).",
  keywords: ["India trip planner", "India itinerary", "India travel planner", "plan a trip to India", "India travel guide", "weekend getaways India", "Himalaya treks", "Rajasthan itinerary", "Kerala itinerary"],
  applicationName: "Ghummakad Saathi",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Ghummakad Saathi — Personalised India trip planner",
    description: "Tell us how you want your India trip to feel. Get matched destinations and a day-by-day plan with real travel options and costs.",
    type: "website",
    siteName: "Ghummakad Saathi",
    locale: "en_IN",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghummakad Saathi — Personalised India trip planner",
    description: "Matched destinations and a day-by-day India itinerary with real travel options and costs.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F5145",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c") }} />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-cream">
          Skip to content
        </a>
        {children}
        <Analytics />
        {CLARITY_ID ? (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
