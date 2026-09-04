import type { Metadata } from "next";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "How it works — Wood Wiz",
  description:
    "How Wood Wiz scrapes firewood vendors, calculates rand per kilogram, handles delivery zones, and what to know about the data's freshness and limits.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return <FAQ />;
}
