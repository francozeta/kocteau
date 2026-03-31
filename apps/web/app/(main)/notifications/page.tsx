import { redirect } from "next/navigation";
import NotificationsInbox from "@/components/notifications-inbox";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import {
  getNotificationsForUser,
  getUnreadNotificationsCount,
} from "@/lib/queries/notifications";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = createPageMetadata({
  title: "Activity",
  description: "Likes and comments on your reviews inside Kocteau.",
  path: "/notifications",
  noIndex: true,
});

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await supabaseServer();
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
