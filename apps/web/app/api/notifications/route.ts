import { NextResponse } from "next/server";
import { getNotificationsForUser } from "@/lib/queries/notifications";
import { supabaseServer } from "@/lib/supabase/server";
import { notificationsListQuerySchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = notificationsListQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Invalid notifications request.");
  }

  const { limit } = parsed.data;

  const notifications = await getNotificationsForUser(
    supabase,
    auth.user.id,
    limit,
  );

  return NextResponse.json({ notifications });
}
