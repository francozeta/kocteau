import { createServerClient } from "@supabase/ssr";
import {
  ForbiddenError,
  UnauthenticatedError,
  type AuthFn,
} from "eve/channels/auth";

type RequestCookie = {
  name: string;
  value: string;
};

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return url;
}

function getSupabasePublishableKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return key;
}

function parseCookieHeader(header: string | null): RequestCookie[] {
  if (!header) {
    return [];
  }

  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex <= 0) {
        return [];
      }

      return [
        {
          name: part.slice(0, separatorIndex),
          value: part.slice(separatorIndex + 1),
        },
      ];
    });
}

export function starterCuratorAuth(): AuthFn<Request> {
  return async (request) => {
    const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("cookie"));
        },
        setAll() {
          // Eve route auth cannot mutate the original Next.js response. The web
          // app owns session refresh; this verifier only reads the current caller.
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new UnauthenticatedError({
        code: "starter_curator_auth_required",
        message: "Sign in to use Eve curation.",
      });
    }

    const { data: hasAccess, error: accessError } =
      await supabase.rpc("is_starter_curator");

    if (accessError || !hasAccess) {
      throw new ForbiddenError({
        code: "starter_curator_required",
        message: "Starter curator access is required.",
      });
    }

    return {
      attributes: {
        email: user.email ?? "",
        role: "starter-curator",
      },
      authenticator: "kocteau-supabase",
      principalId: user.id,
      principalType: "user",
      subject: user.id,
    };
  };
}
