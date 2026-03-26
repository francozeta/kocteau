import { NextResponse } from "next/server";
import { getUnreadNotificationsCount } from "@/lib/queries/notifications";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const { notificationId } = await params;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: current, error: currentError } = await supabase
    .from("notifications")
    .select("id, read_at")
    .eq("id", notificationId)
    .eq("recipient_id", auth.user.id)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json(
      { error: currentError.message, code: currentError.code ?? null },
      { status: currentError.code === "42P01" ? 503 : 400 },
    );
  }

  if (!current) {
    return NextResponse.json(
      { error: "Notification not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  let readAt = current.read_at;

  if (!current.read_at) {
    const { data: updated, error: updateError } = await supabase
      .from("notifications")
      .update({
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("recipient_id", auth.user.id)
      .select("read_at")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message, code: updateError.code ?? null },
        { status: updateError.code === "42P01" ? 503 : 400 },
      );
    }

    readAt = updated.read_at;
  }

  const unreadCount = await getUnreadNotificationsCount(supabase, auth.user.id);

  return NextResponse.json({
    ok: true,
    notificationId,
    readAt,
    unreadCount,
  });
}
