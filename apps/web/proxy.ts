import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isFeedView } from "@/lib/feed-view";
import {
  getShortRouteId,
  isFullUuid,
  isSeoRouteId,
} from "@/lib/seo-routes";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

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
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/")
  );
}

function getShortIdRedirectPath(pathname: string) {
  const trackMatch = pathname.match(/^\/tracks\/([^/]+)\/([^/]+)\/?$/);
  if (trackMatch?.[1] && trackMatch[2] && isFullUuid(trackMatch[2])) {
    return `/tracks/${trackMatch[1]}/${getShortRouteId(trackMatch[2])}`;
  }

  const reviewMatch = pathname.match(/^\/reviews\/([^/]+)\/([^/]+)\/?$/);
  if (reviewMatch?.[1] && reviewMatch[2] && isFullUuid(reviewMatch[1])) {
    return `/reviews/${getShortRouteId(reviewMatch[1])}/${reviewMatch[2]}`;
  }

  return null;
}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

function getFeedLoginRedirect(request: NextRequest, response?: NextResponse) {
  const loginUrl = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", nextPath);
  const redirectResponse = NextResponse.redirect(loginUrl);

  if (response) {
    copyResponseCookies(response, redirectResponse);
  }

  return redirectResponse;
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

  const shortIdRedirectPath = getShortIdRedirectPath(pathname);
  if (shortIdRedirectPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = shortIdRedirectPath;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (canReceiveAuthCallback(pathname) && request.nextUrl.searchParams.has("code")) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  const hasSbCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSbCookie) {
    return pathname === "/feed" ? getFeedLoginRedirect(request) : response;
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (pathname === "/feed" && (claimsError || !claimsData?.claims?.sub)) {
    return getFeedLoginRedirect(request, response);
  }

  if (pathname === "/" && !claimsError && claimsData?.claims?.sub) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/feed";
    redirectUrl.search = "";
    const requestedView = request.nextUrl.searchParams.get("view") ?? undefined;

    if (
      isFeedView(requestedView) &&
      requestedView !== "for-you" &&
      requestedView !== "latest"
    ) {
      redirectUrl.searchParams.set("view", requestedView);
    }

    if (request.nextUrl.searchParams.get("welcome") === "kocteau") {
      redirectUrl.searchParams.set("welcome", "kocteau");
    }

    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyResponseCookies(response, redirectResponse);

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
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
