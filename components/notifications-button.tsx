"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";
import {
  notificationHref,
  notificationMessage,
  notificationTimestamp,
  type NotificationItem,
} from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NotificationsButtonProps = {
  userId: string;
  initialUnreadCount: number;
  initialNotifications: NotificationItem[];
};

export default function NotificationsButton({
  userId,
  initialUnreadCount,
  initialNotifications,
}: NotificationsButtonProps) {
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
    initialUnreadCount,
    initialNotifications,
    limit: 8,
    subscribe: true,
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
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/30 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
            unreadCount > 0 && "text-foreground",
          )}
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold leading-none text-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] gap-0 p-0 sm:w-[24rem]">
        <PopoverHeader className="border-b border-border/40 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <PopoverTitle>Notifications</PopoverTitle>
              <PopoverDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread right now`
                  : "You’re all caught up"}
              </PopoverDescription>
            </div>
            <Link
              href="/notifications"
              className="text-xs font-medium text-foreground transition-opacity hover:opacity-70"
            >
              View all
            </Link>
          </div>
        </PopoverHeader>

        <ScrollArea className="max-h-[26rem]">
          <div className="p-2">
            {isLoadingNotifications ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : isNotificationsError ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                {notificationsError instanceof Error
                  ? notificationsError.message
                  : "Notifications are temporarily unavailable."}
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-1.5">
                {notifications.map((notification) => {
                  const actorLabel =
                    notification.actor?.display_name ??
                    (notification.actor?.username
                      ? `@${notification.actor.username}`
                      : "Someone");

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "rounded-xl border border-transparent bg-card/70 p-3 transition-colors hover:border-border/40 hover:bg-muted/30",
                        !notification.read_at && "border-border/50 bg-muted/30",
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                          {notification.actor?.avatar_url ? (
                            <Image
                              src={notification.actor.avatar_url}
                              alt={actorLabel}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start gap-2">
                            {!notification.read_at ? (
                              <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-foreground" />
                            ) : null}
                            <div className="space-y-1">
                              <p className="text-sm leading-5 text-foreground">
                                {notificationMessage(notification)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {notificationTimestamp(notification.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link href={notificationHref(notification)}>
                              <Button size="sm" variant="outline" className="h-8 gap-2 text-xs">
                                Open
                                <ChevronRight className="size-3.5" />
                              </Button>
                            </Link>

                            {!notification.read_at ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-2 text-xs"
                                disabled={isMarkingAsRead}
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="size-3.5" />
                                Mark read
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Likes and comments on your reviews will land here first.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
