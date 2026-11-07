import "server-only";

import type { StarterTrack } from "@/lib/starter";
import { getPublicStarterTracks } from "@/lib/queries/starter";

// The rotating cover catalog is decorative, not a prerequisite to using
// Search. Previously, a stalled Supabase read blocked the entire Search route.
const SEARCH_STARTER_BUDGET_MS = 2_500;

export async function getSearchStarterTracks(): Promise<StarterTrack[]> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<StarterTrack[]>((resolve) => {
    timeout = setTimeout(() => {
      console.warn({
        event: "search_starters_budget_exceeded",
        budget_ms: SEARCH_STARTER_BUDGET_MS,
      });
      resolve([]);
    }, SEARCH_STARTER_BUDGET_MS);
  });

  try {
    // If Supabase is slow, Search remains accessible with an empty orbit.
    // The ongoing cached loader can still populate its cache for next time.
    return await Promise.race([
      getPublicStarterTracks({ limit: 32, contextKey: "search-orbit" }).catch(
        () => [],
      ),
      deadline,
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
