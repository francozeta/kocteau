import { NextResponse } from "next/server";
import { getUnreadNotificationsCount } from "@/lib/queries/notifications";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const unreadCount = await getUnreadNotificationsCount(supabase, auth.user.id);

  return NextResponse.json({ unreadCount });
}
