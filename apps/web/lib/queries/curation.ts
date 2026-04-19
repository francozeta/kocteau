import "server-only";

import { supabaseServer } from "@/lib/supabase/server";

export async function getStarterCuratorAccess() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("is_starter_curator");

  if (error) {
    console.error("[curation.getStarterCuratorAccess] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
    });

    return false;
  }

  return Boolean(data);
}
