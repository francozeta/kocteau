import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (isMetadataRequest(pathname)) {
    return response;
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
  if (!hasSbCookie) return response;

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

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*opengraph-image|.*twitter-image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
