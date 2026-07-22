import { redirect } from "next/navigation";
import NotificationsInbox from "@/components/notifications-inbox";
import { getCurrentUserId } from "@/lib/auth/server";
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
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const supabase = await supabaseServer();
  const [initialNotifications, initialUnreadCount] = await Promise.all([
    getNotificationsForUser(supabase, userId),
    getUnreadNotificationsCount(supabase, userId),
  ]);

  return (
    <NotificationsInbox
      userId={userId}
      initialNotifications={initialNotifications}
      initialUnreadCount={initialUnreadCount}
    />
  );
}
