"use client";

import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationItem } from "@/lib/notifications";
import NotificationList from "@/components/notification-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

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
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't update that notification right now.",
      );
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-3 border-b border-border/40 pb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
          Activity
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.4rem]">
              Notifications
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Likes and comments on your reviews arrive here first, then settle into your archive.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{notifications.length}</span>
            <span>{notifications.length === 1 ? "recent item" : "recent items"}</span>
            <span>•</span>
            <span className="font-medium text-foreground">{unreadCount}</span>
            <span>{unreadCount === 1 ? "unread" : "unread"}</span>
          </div>
        </div>
      </div>

      {isLoadingNotifications ? (
        <div className="rounded-3xl border border-border/35 bg-card/30 px-5 py-8 text-sm text-muted-foreground">
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
        <Empty className="rounded-3xl border-border/40 bg-card/30 px-8 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No notifications yet</EmptyTitle>
            <EmptyDescription>
              When someone likes or comments on one of your reviews, it will show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
