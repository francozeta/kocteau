import "server-only";

import { supabaseServer } from "@/lib/supabase/server";

export async function getStarterCuratorAccess() {
  const supabase = await supabaseServer();
  // Optional navigation flags are not a prerequisite to reading the Feed.
  // Deny curator UI on timeout; server-side write authorization stays intact.
  const { data, error } = await supabase.rpc("is_starter_curator")
    .abortSignal(AbortSignal.timeout(3_000));

  if (error) {
    console.error("[curation.getStarterCuratorAccess] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
    });

    return false;
  }

  return Boolean(data);
}

export async function getKocteauAdminAccess() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("is_kocteau_admin")
    .abortSignal(AbortSignal.timeout(3_000));

  if (error) {
    console.error("[curation.getKocteauAdminAccess] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
    });

    return false;
  }

  return Boolean(data);
}
