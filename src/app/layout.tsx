import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

/** Microsoft Clarity (analytics). Set NEXT_PUBLIC_CLARITY_ID in Vercel to enable. */
const CLARITY_ID = /^[a-z0-9]{6,20}$/i.test(process.env.NEXT_PUBLIC_CLARITY_ID ?? "") ? process.env.NEXT_PUBLIC_CLARITY_ID : null;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Ghummakad Saathi — plan a trip around how you want to feel",
    template: "%s · Ghummakad Saathi",
  },
  description:
    "Tell us the mood, the people and the budget. We'll turn it into a personalised destination and a clear day-by-day travel plan in one place.",
  openGraph: {
    title: "Ghummakad Saathi",
    description: "Don't search for a destination. Start with how you want to feel.",
    type: "website",
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
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-cream">
          Skip to content
        </a>
        {children}
        {CLARITY_ID ? (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
