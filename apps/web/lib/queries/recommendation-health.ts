import "server-only";

import { measureServerTask } from "@/lib/perf";
import {
  normalizeRecommendationHealthSnapshot,
  type RecommendationHealthSnapshot,
  type RecommendationHealthWindow,
} from "@/lib/recommendation-health/metrics";
import { supabaseServer } from "@/lib/supabase/server";

export type RecommendationHealthResult = {
  snapshot: RecommendationHealthSnapshot;
  unavailable: boolean;
};

export async function getRecommendationHealthSnapshot(
  days: RecommendationHealthWindow,
): Promise<RecommendationHealthResult> {
  return measureServerTask(
    "getRecommendationHealthSnapshot",
    async () => {
      const supabase = await supabaseServer();
      const { data, error } = await supabase.rpc(
        "get_recommendation_health_snapshot",
        { p_days: days },
      );

      if (error) {
        console.error("[recommendationHealth.getSnapshot] failed", {
          code: error.code ?? null,
          message: error.message ?? null,
        });

        return {
          snapshot: normalizeRecommendationHealthSnapshot(null, days),
          unavailable: true,
        };
      }

      return {
        snapshot: normalizeRecommendationHealthSnapshot(data, days),
        unavailable: false,
      };
    },
    { days },
  );
}
