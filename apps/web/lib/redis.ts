import "server-only";

import { createClient, type RedisClientType } from "redis";

let redisClientPromise: Promise<RedisClientType> | null = null;
let missingRedisUrlWarned = false;

export function hasRedisConfig() {
  return Boolean(process.env.REDIS_URL);
}

export async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    if (process.env.NODE_ENV === "production" && !missingRedisUrlWarned) {
      missingRedisUrlWarned = true;
      console.warn("[redis] REDIS_URL is not configured. Redis-backed features are disabled.");
    }

    return null;
  }

  redisClientPromise ??= (async () => {
    const client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1_000),
      },
    }) as RedisClientType;

    client.on("error", (error) => {
      console.error("[redis] client error", {
        message: error.message,
      });
    });

    await client.connect();

    return client;
  })();

  try {
    return await redisClientPromise;
  } catch (error) {
    redisClientPromise = null;
    console.error("[redis] connection failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
