import { NextResponse } from "next/server";
import { getNotificationsForUser } from "@/lib/queries/notifications";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(Math.trunc(rawLimit), 50))
    : 25;

  const notifications = await getNotificationsForUser(
    supabase,
    auth.user.id,
    limit,
  );

  return NextResponse.json({ notifications });
}
