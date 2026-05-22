import "server-only";

import { CREATOR_PERK_KEY } from "@/lib/creator-perks";
import { supabasePublic } from "@/lib/supabase/public";
import { supabaseServer } from "@/lib/supabase/server";

export type CreatorPerk = {
  user_id: string;
  perk_key: string;
  first_review_id: string | null;
  unlocked_at: string;
};

function logCreatorPerksQueryError(
  scope: "getPublicCreatorPerk" | "getViewerCreatorPerk",
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  },
  context: Record<string, unknown>,
) {
  console.error(`[creator-perks.${scope}] failed`, {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    context,
  });
}

export async function getPublicCreatorPerk(userId: string) {
  const supabase = supabasePublic();

  const { data, error } = await supabase
    .from("user_creator_perks")
    .select("user_id, perk_key, first_review_id, unlocked_at")
    .eq("user_id", userId)
    .eq("perk_key", CREATOR_PERK_KEY)
    .maybeSingle<CreatorPerk>();

  if (error) {
    logCreatorPerksQueryError("getPublicCreatorPerk", error, { userId });
    return null;
  }

  return data;
}

export async function getViewerCreatorPerk(userId: string) {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("user_creator_perks")
    .select("user_id, perk_key, first_review_id, unlocked_at")
    .eq("user_id", userId)
    .eq("perk_key", CREATOR_PERK_KEY)
    .maybeSingle<CreatorPerk>();

  if (error) {
    logCreatorPerksQueryError("getViewerCreatorPerk", error, { userId });
    return null;
  }

  return data;
}
