"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 400;

export default function ReturnToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      // Hide when within ~120px of the page bottom so we don't sit on top of
      // the footer.
      const nearBottom =
        scrolled + window.innerHeight >= document.body.scrollHeight - 120;
      setVisible(scrolled > SHOW_AFTER_PX && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Return to top"
      className={`fixed bottom-4 right-4 z-50 inline-flex size-11 items-center justify-center rounded-full bg-amber-700 text-white shadow-lg shadow-amber-900/30 transition-all duration-200 hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:bg-amber-600 dark:hover:bg-amber-500 ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
      }`}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
