"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef } from "react";
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
    queryWarmup?: QueryWarmupDescriptor | QueryWarmupDescriptor[];
  };

function isDeferredResolverHref(href: LinkProps["href"]) {
  return typeof href === "string" && href.startsWith("/track/deezer/");
}

const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (
    {
      href,
      onMouseEnter,
      onFocus,
      onTouchStart,
      queryWarmup: _queryWarmup,
      prefetch,
      ...props
    },
    ref,
  ) => {
    const canPrefetchRoute = !isDeferredResolverHref(href);
    // Keep the descriptor for call-site compatibility. Next's native scheduler now
    // owns viewport and intent prefetching for these routes.
    void _queryWarmup;

    return (
      <Link
        ref={ref}
        href={href}
        prefetch={canPrefetchRoute ? prefetch : false}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
        onTouchStart={onTouchStart}
        {...props}
      />
    );
  },
);

PrefetchLink.displayName = "PrefetchLink";

export default PrefetchLink;
