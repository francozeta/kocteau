import "server-only";

import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

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

const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

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
} satisfies Record<string, RateLimitConfig>;

function sanitizeIdentifier(identifier: string) {
  return identifier.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 160);
}

function toRateLimitTuple(value: unknown): [number, number] {
  if (!Array.isArray(value)) {
    return [0, 0];
  }

  const [count, ttl] = value;

  return [
    typeof count === "number" ? count : Number(count ?? 0),
    typeof ttl === "number" ? ttl : Number(ttl ?? 0),
  ];
}

export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string,
): Promise<RateLimitResult> {
  const redis = await getRedisClient();

  if (!redis) {
    return {
      ok: true,
      enabled: false,
      limit: config.limit,
      remaining: config.limit,
      resetMs: config.windowMs,
      retryAfterSeconds: 0,
    };
  }

  const key = `kocteau:rate-limit:${config.name}:${sanitizeIdentifier(identifier)}`;

  try {
    const [count, ttl] = toRateLimitTuple(
      await redis.eval(RATE_LIMIT_SCRIPT, {
        keys: [key],
        arguments: [String(config.windowMs)],
      }),
    );
    const resetMs = ttl > 0 ? ttl : config.windowMs;
    const remaining = Math.max(config.limit - count, 0);

    return {
      ok: count <= config.limit,
      enabled: true,
      limit: config.limit,
      remaining,
      resetMs,
      retryAfterSeconds: Math.max(1, Math.ceil(resetMs / 1000)),
    };
  } catch (error) {
    console.error("[rate-limit] check failed", {
      name: config.name,
      message: error instanceof Error ? error.message : String(error),
    });

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
