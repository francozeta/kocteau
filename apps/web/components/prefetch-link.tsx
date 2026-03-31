"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, startTransition } from "react";
import type { AnchorHTMLAttributes } from "react";

export type QueryWarmupDescriptor =
  | {
      kind: "feed";
    }
  | {
      kind: "review";
      id: string;
    }
  | {
      kind: "track";
      id: string;
    };

type PrefetchLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    warmOnHover?: boolean;
    warmOnFocus?: boolean;
    warmOnTouch?: boolean;
    queryWarmup?: QueryWarmupDescriptor | QueryWarmupDescriptor[];
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
      queryWarmup: _queryWarmup,
      prefetch = true,
      ...props
    },
    ref,
  ) => {
    const router = useRouter();
    // Route prefetch already carries the server-rendered query state for these pages.
    void _queryWarmup;

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
