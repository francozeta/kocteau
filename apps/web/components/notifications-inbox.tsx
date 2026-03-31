"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationItem } from "@/lib/notifications";
import NotificationList from "@/components/notification-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toastActionError } from "@/lib/feedback";

type NotificationsInboxProps = {
  userId: string;
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
};

export default function NotificationsInbox({
  userId,
  initialNotifications,
  initialUnreadCount,
}: NotificationsInboxProps) {
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    isNotificationsError,
    notificationsError,
    markAsRead,
    isMarkingAsRead,
  } = useNotifications({
    userId,
    initialNotifications,
    initialUnreadCount,
    subscribe: false,
    enableList: true,
  });

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      toastActionError(error, "We couldn't update that notification right now.");
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <div className="border-b border-border/30 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
              Activity
            </h1>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{notifications.length}</span>
              <span>{notifications.length === 1 ? "item" : "items"}</span>
              <span>•</span>
              <span className="font-medium text-foreground">{unreadCount}</span>
              <span>unread</span>
            </div>
          </div>
        </div>
      </div>

      {isLoadingNotifications ? (
        <div className="rounded-[1.75rem] border border-border/25 bg-card/20 px-5 py-8 text-sm text-muted-foreground">
          Loading notifications...
        </div>
      ) : isNotificationsError ? (
        <Alert className="rounded-2xl border-border/50 bg-card/60 p-4">
          <AlertTitle>Notifications unavailable</AlertTitle>
          <AlertDescription>
            {notificationsError instanceof Error
              ? notificationsError.message
              : "Notifications are temporarily unavailable."}
          </AlertDescription>
        </Alert>
      ) : notifications.length > 0 ? (
        <NotificationList
          notifications={notifications}
          isMarkingAsRead={isMarkingAsRead}
          onMarkAsRead={handleMarkAsRead}
        />
      ) : (
        <Empty className="rounded-[1.75rem] border-border/25 bg-card/20 px-6 py-10 sm:px-8 sm:py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No notifications yet</EmptyTitle>
            <EmptyDescription>
              Likes and comments will show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
