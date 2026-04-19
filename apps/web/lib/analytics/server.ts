import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import type { supabaseServer } from "@/lib/supabase/server";
import type { AnalyticsEventInput } from "@/lib/validation/schemas";

type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>;

type TrackServerAnalyticsEventOptions = AnalyticsEventInput & {
  userId: string;
};

export async function trackServerAnalyticsEvent(
  supabase: SupabaseServerClient,
  {
    userId,
    eventType,
    source,
    metadata,
  }: TrackServerAnalyticsEventOptions,
) {
  const { error } = await supabase
    .from("analytics_events")
    .insert({
      user_id: userId,
      event_type: eventType,
      source,
      metadata: metadata as Json,
    });

  if (error) {
    console.warn("[analytics.trackServerAnalyticsEvent] skipped", {
      eventType,
      source,
      code: error.code ?? null,
      message: error.message ?? null,
    });
  }
}
