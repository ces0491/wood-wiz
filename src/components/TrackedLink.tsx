"use client";

import { track } from "@vercel/analytics";

// Wraps an outbound <a> so we can fire a Vercel Analytics custom event
// when users click through to a vendor's storefront. Lets us tell which
// vendor links convert vs which just get glanced at.
export default function TrackedLink({
  href,
  event,
  data,
  className,
  title,
  children,
}: {
  href: string;
  event: string;
  data?: Record<string, string | number | boolean | null>;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={className}
      onClick={() => {
        try {
          track(event, data);
        } catch {
          // Analytics errors must never block the navigation.
        }
      }}
    >
      {children}
    </a>
  );
}
