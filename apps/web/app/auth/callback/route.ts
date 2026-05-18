import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { safeInternalPath } from "@/lib/internal-path";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const callbackError = url.searchParams.get("error");
  const callbackErrorCode = url.searchParams.get("error_code");
  const explicitNext = safeInternalPath(url.searchParams.get("next"));
  const supabase = await supabaseServer();

  async function redirectFromExistingSession() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return null;
    }

    const redirectTo = await getPostAuthRedirect(supabase, data.user.id, {
      next: explicitNext,
    });
    return NextResponse.redirect(new URL(redirectTo, url.origin));
  }

  if (!code) {
    const existingSessionRedirect = await redirectFromExistingSession();

    if (existingSessionRedirect) {
      return existingSessionRedirect;
    }

    const loginUrl = new URL("/login", url.origin);

    if (callbackError) {
      loginUrl.searchParams.set("error", callbackError);
    }

    if (callbackErrorCode) {
      loginUrl.searchParams.set("error_code", callbackErrorCode);
    }

    if (explicitNext) {
      loginUrl.searchParams.set("next", explicitNext);
    }

    return NextResponse.redirect(loginUrl);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const existingSessionRedirect = await redirectFromExistingSession();

    if (existingSessionRedirect) {
      return existingSessionRedirect;
    }

    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "auth_callback_failed");
    if (explicitNext) {
      loginUrl.searchParams.set("next", explicitNext);
    }
    return NextResponse.redirect(loginUrl);
  }

  const redirectTo = await getPostAuthRedirect(supabase, data.user.id, {
    next: explicitNext,
  });

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
