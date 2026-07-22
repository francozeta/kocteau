import { NextResponse } from "next/server";
import { trackServerAnalyticsEvents } from "@/lib/analytics/server";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";
import { analyticsEventBatchSchema, analyticsEventSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(
    rateLimits.trackAnalyticsEvent,
    auth.user.id,
  );

  if (rateLimited) {
    return rateLimited;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsedBatch = analyticsEventBatchSchema.safeParse(payload);
  const parsedEvent = parsedBatch.success
    ? null
    : analyticsEventSchema.safeParse(payload);

  if (!parsedBatch.success && !parsedEvent?.success) {
    return validationErrorResponse(parsedBatch.error, "Invalid analytics event.");
  }

  const events = parsedBatch.success
    ? parsedBatch.data.events
    : parsedEvent?.success
      ? [parsedEvent.data]
      : [];

  await trackServerAnalyticsEvents(supabase, {
    userId: auth.user.id,
    events,
  });

  return NextResponse.json({ ok: true });
}
