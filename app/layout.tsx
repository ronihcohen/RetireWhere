import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://retirewhere.vercel.app";

const TITLE = "RetireWhere — Retirement Calculator by Cost of Living";
const DESCRIPTION =
  "Calculate exactly how much you need to retire in any country or city. Enter your monthly spend, pick a destination, and get a tax-adjusted nest egg number using the 4% rule scaled by cost of living.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s — RetireWhere",
  },
  description: DESCRIPTION,
  keywords: [
    "retirement calculator",
    "retire abroad",
    "cost of living calculator",
    "nest egg calculator",
    "4% rule calculator",
    "how much to retire",
    "retirement number",
    "retire in Portugal",
    "retire in Thailand",
    "financial independence",
    "FIRE calculator",
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "RetireWhere",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@retirewhere",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen antialiased">{children}</body>
    </html>
  );
}
