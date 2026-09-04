import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import ReturnToTop from "@/components/ReturnToTop";
import InstallBanner from "@/components/InstallBanner";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // What Next.js absolutises OG image URLs against in social previews. Shared
  // with the sitemap and robots policy so all three name the same origin.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wood Wiz — South African firewood prices per kg",
    template: "%s",
  },
  description:
    "Compare braai, fireplace and smoking wood prices from the vendors who deliver to your city, normalised to rand per kilogram. Daily refresh, no affiliate links.",
  openGraph: {
    type: "website",
    siteName: "Wood Wiz",
    title: "Wood Wiz — South African firewood prices per kg",
    description:
      "Firewood vendors ranked by rand per kilogram, city by city. Daily refresh, no affiliate links.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wood Wiz — South African firewood prices per kg",
    description:
      "Firewood vendors ranked by rand per kilogram, city by city. Daily refresh, no affiliate links.",
  },
  // Standalone launch metadata for iOS "Add to Home Screen" — the manifest
  // covers Android/Chromium. capable + title give the installed shortcut its
  // own name and a full-screen, browser-chrome-free launch.
  appleWebApp: {
    capable: true,
    title: "Wood Wiz",
    statusBarStyle: "default",
  },
};

// Tint the mobile browser toolbar to match the page surface in each scheme.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="relative flex min-h-full flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 bg-linear-to-b from-amber-200/50 via-orange-100/30 to-transparent dark:from-amber-900/25 dark:via-orange-950/15 dark:to-transparent"
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-amber-700 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        <SiteNav />
        <InstallBanner />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <ReturnToTop />
        <Analytics />
      </body>
    </html>
  );
}
