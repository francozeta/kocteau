import { z } from "zod";
import type { SearchScope } from "../search-types";

export type DiscoverySearchState = { query: string; scope: SearchScope };

const snapshotSchema = z.object({
  account: z.string(),
  path: z.string().max(2048),
  savedAt: z.number(),
  search: z.object({
    query: z.string().max(80),
    scope: z.enum(["all", "track", "album", "artist"]),
  }),
});

export function readDiscoverySearchState(
  value: unknown,
  now: number,
  account: string,
  path: string,
): DiscoverySearchState | null {
  const parsed = snapshotSchema.safeParse(value);
  if (!parsed.success) return null;
  const snapshot = parsed.data;
  if (
    snapshot.account !== account ||
    snapshot.path !== path ||
    snapshot.savedAt > now ||
    now - snapshot.savedAt > 8 * 60 * 60 * 1000
  )
    return null;
  return snapshot.search;
}
