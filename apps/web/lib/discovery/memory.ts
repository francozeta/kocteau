import { z } from "zod";
import { CANVAS_LIMIT, MEMORY_LIMIT, MEMORY_TTL, PATH_LIMIT } from "./canvas";

const seed = z.object({
  id: z.string().max(200),
  entityId: z.string().uuid().nullable(),
  provider_id: z.string().regex(/^\d+$/),
  type: z.enum(["track", "album", "artist"]),
  title: z.string().max(1000),
  artist_name: z.string().max(1000).nullable(),
  artist_provider_id: z.string().regex(/^\d+$/).nullable(),
  cover_url: z
    .string()
    .max(2048)
    .regex(/^https:\/\//)
    .nullable(),
});
const sessionSchema = z
  .object({
    frames: z
      .array(
        z.object({
          id: z.string().max(100),
          focus: seed.nullable(),
          depth: z.number().int().nonnegative(),
          resolved: z.boolean(),
          nodes: z
            .array(
              z.object({
                seed,
                from: z.string().max(100).nullable(),
                reason: z.string().max(2000),
                depth: z.number().int().nonnegative(),
              }),
            )
            .max(CANVAS_LIMIT),
        }),
      )
      .min(1)
      .max(PATH_LIMIT),
    cursor: z.number().int().nonnegative(),
  })
  .refine((value) => value.cursor < value.frames.length);
const memorySchema = z
  .array(
    z.object({
      key: z.string().max(100),
      artist: z.string().max(1000),
      count: z.number().int().min(1).max(8),
      lastOpened: z.number().nonnegative(),
    }),
  )
  .max(MEMORY_LIMIT);

export function discoveryMemoryKey(viewerId: string | null) {
  return `kocteau:discovery:v1:${viewerId ?? "guest"}`;
}

export function parseCanvasSnapshot(
  value: unknown,
  now: number,
  scope?: string,
) {
  const result = z
    .object({
      savedAt: z.number(),
      scope: z.string().optional(),
      session: sessionSchema,
    })
    .safeParse(value);
  if (
    !result.success ||
    result.data.savedAt > now ||
    now - result.data.savedAt > 8 * 60 * 60 * 1000
  )
    return null;
  if (scope && scope !== result.data.scope) return null;
  return result.data.session;
}

export function readDiscoveryMemory(raw: string | null, now: number) {
  try {
    if (!raw || raw.length > 160_000) return [];
    const result = memorySchema.safeParse(JSON.parse(raw));
    return result.success
      ? result.data.filter(
          (visit) =>
            visit.lastOpened <= now && now - visit.lastOpened < MEMORY_TTL,
        )
      : [];
  } catch {
    return [];
  }
}

export function readCanvasSession(
  raw: string | null,
  now: number,
  scope?: string,
) {
  try {
    if (!raw || raw.length > 600_000) return null;
    return parseCanvasSnapshot(JSON.parse(raw), now, scope);
  } catch {
    return null;
  }
}
