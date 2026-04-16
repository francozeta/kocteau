import { NextResponse } from "next/server";
import { getUnreadNotificationsCount } from "@/lib/queries/notifications";
import { enforceRateLimit, rateLimits } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(
    rateLimits.markNotificationsReadAll,
    auth.user.id,
  );

  if (rateLimited) {
    return rateLimited;
  }

  const readAt = new Date().toISOString();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("recipient_id", auth.user.id)
    .is("read_at", null);

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status: error.code === "42P01" ? 503 : 400 },
    );
  }

  const unreadCount = await getUnreadNotificationsCount(supabase, auth.user.id);

  return NextResponse.json({
    ok: true,
    readAt,
    unreadCount,
  });
}
