import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";

export class CatalogResearchDeferred extends Error {
  constructor() {
    super("Catalog research will continue on the next worker run.");
  }
}

export async function withMusicBrainzLease<T>(deadline: number, request: () => Promise<T>) {
  const supabase = supabaseAdmin();
  while (Date.now() + 13_000 < deadline) {
    const startedAt = Date.now();
    const { data: token, error } = await supabase
      .rpc("acquire_catalog_source_lease")
      .abortSignal(AbortSignal.timeout(3_000));
    if (error) throw new Error("Catalog source coordination is unavailable.");
    if (token) {
      try {
        // Leave room for the provider's ten-second timeout before the lease expires.
        if (Date.now() - startedAt > 5_000) throw new CatalogResearchDeferred();
        return await request();
      } finally {
        const { error: releaseError } = await supabase
          .rpc("release_catalog_source_lease", { p_token: token })
          .abortSignal(AbortSignal.timeout(3_000));
        if (releaseError) console.error("[catalog.research] source lease will expire");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1_100));
  }
  throw new CatalogResearchDeferred();
}
