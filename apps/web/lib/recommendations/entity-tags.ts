import "server-only";

import type { supabaseServer } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>;

function getSignalWeight(rating: number) {
  if (rating >= 4.5) {
    return 0.7;
  }

  if (rating >= 4) {
    return 0.55;
  }

  return 0.4;
}

export async function inferEntityPreferenceTagsFromReview(
  supabase: SupabaseServerClient,
  {
    entityId,
    rating,
    context,
  }: {
    entityId: string | null | undefined;
    rating: number;
    context: string;
  },
) {
  if (!entityId || rating < 3.5) {
    return;
  }

  const { error } = await supabase.rpc("infer_entity_preference_tags_from_user", {
    p_entity_id: entityId,
    p_signal_weight: getSignalWeight(rating),
  });

  if (error) {
    console.warn("[recommendations.inferEntityPreferenceTags] skipped", {
      context,
      code: error.code ?? null,
      message: error.message ?? null,
    });
  }
}
