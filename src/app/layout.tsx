import type { Metadata } from "next";
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
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
