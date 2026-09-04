/**
 * Scroll to the top, honouring a stated motion preference.
 *
 * `behavior: "smooth"` is animation, and a reader who has asked their OS to
 * reduce motion has asked for exactly this not to happen — for some people
 * it's a trigger, not a nicety. `matchMedia` is read at call time rather than
 * cached, so toggling the OS setting takes effect without a reload.
 */
export function scrollToTop(): void {
  if (typeof window === "undefined") return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}
