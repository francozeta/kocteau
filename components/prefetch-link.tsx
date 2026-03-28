"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, startTransition } from "react";
import type { AnchorHTMLAttributes } from "react";

type PrefetchLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    warmOnHover?: boolean;
    warmOnFocus?: boolean;
    warmOnTouch?: boolean;
  };

function canWarmHref(href: LinkProps["href"]): href is string {
  return typeof href === "string" && href.startsWith("/");
}

const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (
    {
      href,
      onMouseEnter,
      onFocus,
      onTouchStart,
      warmOnHover = true,
      warmOnFocus = true,
      warmOnTouch = true,
      prefetch = true,
      ...props
    },
    ref,
  ) => {
    const router = useRouter();

    function warmRoute() {
      if (!canWarmHref(href)) {
        return;
      }

      startTransition(() => {
        router.prefetch(href);
      });
    }

    return (
      <Link
        ref={ref}
        href={href}
        prefetch={prefetch}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);
          if (warmOnHover) {
            warmRoute();
          }
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (warmOnFocus) {
            warmRoute();
          }
        }}
        onTouchStart={(event) => {
          onTouchStart?.(event);
          if (warmOnTouch) {
            warmRoute();
          }
        }}
        {...props}
      />
    );
  },
);

PrefetchLink.displayName = "PrefetchLink";

export default PrefetchLink;
