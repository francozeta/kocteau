import "server-only";

import { track } from "@vercel/analytics/server";
import { after } from "next/server";
import type { Json } from "@/lib/supabase/database.types";
import type { supabaseServer } from "@/lib/supabase/server";
import { buildVercelAnalyticsProperties } from "@/lib/analytics/vercel";
import type { AnalyticsEventInput } from "@/lib/validation/schemas";

type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>;

type TrackServerAnalyticsEventOptions = AnalyticsEventInput & {
  userId: string;
};

type TrackServerAnalyticsEventsOptions = {
  userId: string;
  events: AnalyticsEventInput[];
};

export async function trackServerAnalyticsEvents(
  supabase: SupabaseServerClient,
  { userId, events }: TrackServerAnalyticsEventsOptions,
) {
  if (events.length === 0) {
    return;
  }

  const rows = events.map(({ eventType, source, metadata }) => ({
    user_id: userId,
    event_type: eventType,
    source,
    metadata: metadata as Json,
  }));

  after(async () => {
    try {
      const [supabaseResult, vercelResults] = await Promise.all([
        supabase.from("analytics_events").insert(rows),
        Promise.allSettled(
          events.map((event) =>
            track(
              event.eventType,
              buildVercelAnalyticsProperties(event),
            ),
          ),
        ),
      ]);

      if (supabaseResult.error) {
        console.warn("[analytics.trackServerAnalyticsEvents] skipped", {
          eventCount: events.length,
          code: supabaseResult.error.code ?? null,
          message: supabaseResult.error.message ?? null,
        });
      }

      const rejectedCount = vercelResults.filter(
        (result) => result.status === "rejected",
      ).length;

      if (rejectedCount > 0) {
        console.warn("[analytics.trackVercelServerEvents] skipped", {
          eventCount: events.length,
          rejectedCount,
        });
      }
    } catch (error) {
      console.warn("[analytics.trackServerAnalyticsEvents] failed", {
        eventCount: events.length,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}

export async function trackServerAnalyticsEvent(
  supabase: SupabaseServerClient,
  {
    userId,
    eventType,
    source,
    metadata,
  }: TrackServerAnalyticsEventOptions,
) {
  return trackServerAnalyticsEvents(supabase, {
    userId,
    events: [{ eventType, source, metadata }],
  });
}
