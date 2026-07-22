import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isFeedView } from "@/lib/feed-view";
import { getShortRouteId, isFullUuid } from "@/lib/seo-routes";
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
  const response = NextResponse.next({ request });
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
