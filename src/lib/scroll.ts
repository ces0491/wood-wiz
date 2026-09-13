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
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

/**
 * Scroll an element to the top of the viewport, with the same motion rule.
 * Sticky chrome above it is cleared with `scroll-margin-top` on the element.
 */
export function scrollToElement(el: Element | null): void {
  if (typeof window === "undefined" || !el) return;
  el.scrollIntoView({ block: "start", behavior: scrollBehavior() });
}

function scrollBehavior(): ScrollBehavior {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  return reduce ? "auto" : "smooth";
}
