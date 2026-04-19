import "server-only";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export type RateLimitResult = {
  ok: boolean;
  enabled: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
};

type RateLimitConfig = {
  name: string;
  limit: number;
  windowMs: number;
};

let unavailableRateLimitWarned = false;

export const rateLimits = {
  createReview: {
    name: "review:create",
    limit: 10,
    windowMs: 10 * 60_000,
  },
  updateReview: {
    name: "review:update",
    limit: 30,
    windowMs: 10 * 60_000,
  },
  deleteReview: {
    name: "review:delete",
    limit: 12,
    windowMs: 10 * 60_000,
  },
  toggleReviewLike: {
    name: "review:like",
    limit: 120,
    windowMs: 60_000,
  },
  toggleReviewBookmark: {
    name: "review:bookmark",
    limit: 90,
    windowMs: 60_000,
  },
  createComment: {
    name: "comment:create",
    limit: 20,
    windowMs: 5 * 60_000,
  },
  deleteComment: {
    name: "comment:delete",
    limit: 30,
    windowMs: 5 * 60_000,
  },
  toggleProfileFollow: {
    name: "profile:follow",
    limit: 40,
    windowMs: 10 * 60_000,
  },
  markNotificationRead: {
    name: "notification:read",
    limit: 90,
    windowMs: 60_000,
  },
  markNotificationsReadAll: {
    name: "notification:read-all",
    limit: 20,
    windowMs: 60_000,
  },
  revalidateProfile: {
    name: "profile:revalidate",
    limit: 20,
    windowMs: 10 * 60_000,
  },
  saveTastePreferences: {
    name: "taste:save",
    limit: 20,
    windowMs: 10 * 60_000,
  },
  trackAnalyticsEvent: {
    name: "analytics:event",
    limit: 240,
    windowMs: 60_000,
  },
} satisfies Record<string, RateLimitConfig>;

export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string,
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));

  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_limit: config.limit,
      p_scope: config.name,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : null;

    if (!result) {
      throw new Error("Missing rate limit result.");
    }

    const resetMs = Math.max(
      new Date(result.reset_at).getTime() - Date.now(),
      1_000,
    );

    return {
      ok: result.ok,
      enabled: true,
      limit: config.limit,
      remaining: Math.max(Number(result.remaining ?? 0), 0),
      resetMs,
      retryAfterSeconds: Math.max(1, Math.ceil(resetMs / 1000)),
    };
  } catch (error) {
    if (!unavailableRateLimitWarned) {
      unavailableRateLimitWarned = true;
      console.error("[rate-limit] check failed; continuing without rate limit", {
        name: config.name,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    // Fail open if the migration is not applied yet. Route handlers still
    // authenticate and validate authorization before mutations run.
    return {
      ok: true,
      enabled: false,
      limit: config.limit,
      remaining: config.limit,
      resetMs: config.windowMs,
      retryAfterSeconds: 0,
    };
  }
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: "Too many requests. Please wait a moment and try again.",
      code: "RATE_LIMITED",
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)),
      },
    },
  );
}

export async function enforceRateLimit(
  config: RateLimitConfig,
  identifier: string,
) {
  const result = await checkRateLimit(config, identifier);

  return result.ok ? null : rateLimitResponse(result);
}
