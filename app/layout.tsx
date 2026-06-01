import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://retirewhere.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "RetireWhere",
    template: "%s — RetireWhere",
  },
  description:
    "Find out how much you need invested to retire anywhere in the world. Enter your current spend, pick a destination, and get a tax-adjusted nest egg number.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "RetireWhere",
    description: "Your personalised retirement number — scaled by cost of living.",
    url: SITE_URL,
    siteName: "RetireWhere",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RetireWhere",
    description: "Your personalised retirement number — scaled by cost of living.",
  },
  robots: {
    index: true,
    follow: true,
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
