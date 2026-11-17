import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isFullUuid,
  isSeoRouteId,
  parseSeoRouteSegment,
} from "@/lib/seo-routes";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { classifyAuthClaims } from "@/lib/auth/claims-policy";

function isMetadataRequest(pathname: string) {
  return (
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes("/opengraph-image") ||
    pathname.includes("/twitter-image")
  );
}

function isDeezerResolverPath(pathname: string) {
  return pathname.startsWith("/track/deezer/");
}

function isKnownCrawler(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";

  return /(?:bot|crawler|spider|slurp|ahrefs|semrush|bytespider|gptbot|claudebot|ccbot|petalbot|dotbot|mj12bot)/i.test(
    userAgent,
  );
}

function getResolverRejectionResponse() {
  return new NextResponse(null, {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function getPublicRouteNotFoundResponse() {
  return new NextResponse(null, {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

type PublicRouteLookup = {
  table: "artists" | "entities" | "profiles" | "reviews";
  column: "id" | "short_id" | "username";
  value: string;
  prefix?: boolean;
  entityType?: "album" | "track";
};

function decodeRoutePart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function getPublicRouteLookup(pathname: string): PublicRouteLookup | null | false {
  const compact = /^\/(tracks|albums|artists|reviews)\/([^/]+)\/?$/.exec(pathname);
  if (compact) {
    const segment = decodeRoutePart(compact[2]);
    const identity = segment && parseSeoRouteSegment(segment);
    if (!identity) return false;
    return {
      table: compact[1] === "reviews" ? "reviews" : compact[1] === "artists" ? "artists" : "entities",
      column: "short_id",
      value: identity.id,
      ...(compact[1] === "tracks" || compact[1] === "albums"
        ? { entityType: compact[1] === "albums" ? "album" as const : "track" as const }
        : {}),
    };
  }
  const reviewMatch = pathname.match(/^\/reviews\/([^/]+)\/[^/]+\/?$/);
  if (reviewMatch?.[1]) {
    const routeId = decodeRoutePart(reviewMatch[1]);
    if (!routeId || !isSeoRouteId(routeId)) return false;

    return {
      table: "reviews",
      column: isFullUuid(routeId) ? "id" : "short_id",
      value: routeId.toLowerCase(),
      prefix: routeId.length === 8,
    };
  }

  const entityMatch = pathname.match(/^\/(tracks|albums)\/[^/]+\/([^/]+)\/?$/);
  if (entityMatch?.[1] && entityMatch[2]) {
    const routeId = decodeRoutePart(entityMatch[2]);
    if (!routeId || !isSeoRouteId(routeId)) return false;

    return {
      table: "entities",
      column: isFullUuid(routeId) ? "id" : "short_id",
      value: routeId.toLowerCase(),
      prefix: routeId.length === 8,
      entityType: entityMatch[1] === "albums" ? "album" : "track",
    };
  }

  const artistMatch = pathname.match(/^\/artists\/[^/]+\/([^/]+)\/?$/);
  if (artistMatch?.[1]) {
    const routeId = decodeRoutePart(artistMatch[1]);
    if (!routeId || !isSeoRouteId(routeId)) return false;

    return {
      table: "artists",
      column: isFullUuid(routeId) ? "id" : "short_id",
      value: routeId.toLowerCase(),
      prefix: routeId.length === 8,
    };
  }

  const profileMatch = pathname.match(/^\/u\/([^/]+)\/?$/);
  if (profileMatch?.[1]) {
    const username = decodeRoutePart(profileMatch[1]);
    if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) return false;

    return {
      table: "profiles",
      column: "username",
      value: username,
    };
  }

  return null;
}

async function publicRouteExists(lookup: PublicRouteLookup) {
  const url = new URL(`/rest/v1/${lookup.table}`, getSupabaseUrl());
  const filter = lookup.prefix ? `like.${lookup.value}*` : `eq.${lookup.value}`;
  const publishableKey = getSupabasePublishableKey();

  url.searchParams.set("select", "id");
  url.searchParams.set(lookup.column, filter);
  url.searchParams.set("limit", "2");

  if (lookup.entityType) {
    url.searchParams.set("type", `eq.${lookup.entityType}`);
  }

  try {
    const response = await fetch(url, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return true;
    }

    const rows = (await response.json()) as Array<{ id: string }>;
    return rows.length === 1;
  } catch {
    return true;
  }
}

function canReceiveAuthCallback(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/home" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/")
  );
}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  // Supabase SSR may attach cache prevention to a refreshed token response.
  // A rewritten response must carry that protection as well as its cookies.
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
}

function authUnavailableResponse() {
  // If the origin is temporarily unavailable, never present an authenticated
  // visitor as signed out or emit refreshed/expired cookies from a failed read.
  return new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kocteau temporarily unavailable</title><body style="margin:0;background:#080808;color:#ededed;font:15px system-ui;display:grid;min-height:100svh;place-items:center"><main style="max-width:25rem;padding:1.5rem"><h1 style="font-size:1.2rem">Kocteau is temporarily unavailable</h1><p style="line-height:1.6;color:#aaa">We could not verify your session right now. Your account is still here.</p><a href="/" style="color:#ededed">Try again</a></main></body></html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Retry-After": "5",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

// Serve the same ISR-backed public landing at / without redirecting the browser.
// The rewrite never renders the authenticated (main) route and only exposes
// publicly cached /home data. A stale session remains non-cacheable.
function rewritePublicHome(request: NextRequest, response: NextResponse) {
  const target = request.nextUrl.clone();
  target.pathname = "/home";
  target.search = "";
  const rewritten = NextResponse.rewrite(target, {
    request: { headers: request.headers },
  });
  copyResponseCookies(response, rewritten);
  if (request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"))) {
    rewritten.headers.set("Cache-Control", "private, no-store");
  }
  return rewritten;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (isMetadataRequest(pathname)) {
    return response;
  }

  if (isDeezerResolverPath(pathname)) {
    const providerId = pathname.split("/").filter(Boolean).at(-1) ?? "";

    if (!/^[1-9]\d{0,19}$/.test(providerId) || isKnownCrawler(request)) {
      return getResolverRejectionResponse();
    }
  }

  const publicRouteLookup = getPublicRouteLookup(pathname);
  if (publicRouteLookup === false) {
    return getPublicRouteNotFoundResponse();
  }

  if (
    publicRouteLookup &&
    (request.method === "HEAD" || isKnownCrawler(request)) &&
    !(await publicRouteExists(publicRouteLookup))
  ) {
    return getPublicRouteNotFoundResponse();
  }

  if (canReceiveAuthCallback(pathname) && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  // Keep historical Feed links working without a second app-facing route.
  if (pathname === "/feed") {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    return NextResponse.redirect(target, 308);
  }

  const hasSbCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSbCookie) {
    if (pathname === "/") {
      return rewritePublicHome(request, response);
    }
    return response;
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, authHeaders) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          // @supabase/ssr >= 0.12 supplies headers for refreshed tokens.
          // Required to prevent a CDN from storing Set-Cookie HTML.
          for (const header of ["cache-control", "expires", "pragma"]) {
            const value = authHeaders?.[header];
            if (value) response.headers.set(header, value);
          }
        },
      },
    }
  );

  let claimsOutcome: ReturnType<typeof classifyAuthClaims>;
  try {
    const { data, error } = await supabase.auth.getClaims();
    claimsOutcome = classifyAuthClaims(data?.claims?.sub, error);
  } catch {
    claimsOutcome = "unavailable";
  }

  if (pathname === "/") {
    if (claimsOutcome === "unavailable") {
      return authUnavailableResponse();
    }
    if (claimsOutcome === "anonymous") {
      return rewritePublicHome(request, response);
    }
    // The authenticated Feed must never be cached on a shared edge.
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }

  return response;
}

export const config = {
  matcher: [
    // Include root RSC prefetches: guests must not preload a private Feed
    // redirect that differs from the public document response.
    { source: "/" },
    {
      source:
        "/((?!api|monitoring|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|woff|woff2|ttf|otf)$|.*opengraph-image|.*twitter-image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
