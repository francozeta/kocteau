import { redirect } from "next/navigation";
import NotificationsInbox from "@/components/notifications-inbox";
import {
  getNotificationsForUser,
  getUnreadNotificationsCount,
} from "@/lib/queries/notifications";
import { supabaseServer } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [initialNotifications, initialUnreadCount] = await Promise.all([
    getNotificationsForUser(supabase, user.id),
    getUnreadNotificationsCount(supabase, user.id),
  ]);

  return (
    <NotificationsInbox
      userId={user.id}
      initialNotifications={initialNotifications}
      initialUnreadCount={initialUnreadCount}
    />
  );
}
