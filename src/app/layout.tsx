import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wood Wiz — Cape Town firewood prices per kg",
  description:
    "Compare braai, fireplace and smoking wood prices across Cape Town vendors, normalized to price per kilogram including delivery transparency.",
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
        <SiteNav />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
