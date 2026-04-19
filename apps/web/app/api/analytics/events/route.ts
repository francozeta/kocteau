import { NextResponse } from "next/server";
import { trackServerAnalyticsEvent } from "@/lib/analytics/server";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";
import { analyticsEventSchema } from "@/lib/validation/schemas";
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
  const parsed = analyticsEventSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Invalid analytics event.");
  }

  await trackServerAnalyticsEvent(supabase, {
    userId: auth.user.id,
    ...parsed.data,
  });

  return NextResponse.json({ ok: true });
}
