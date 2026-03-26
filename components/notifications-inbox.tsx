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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-muted/60 via-background to-background py-0 shadow-sm">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Bell className="size-3.5" />
            Private inbox
          </div>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Notifications
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Likes and comments land here first. Realtime keeps the badge fresh, but your
              inbox is always backed by the database.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>{notifications.length} recent notifications</span>
            <span>•</span>
            <span>{unreadCount} unread</span>
          </div>
        </CardContent>
      </Card>

      {isLoadingNotifications ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading notifications...
          </CardContent>
        </Card>
      ) : isNotificationsError ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {notificationsError instanceof Error
              ? notificationsError.message
              : "Notifications are temporarily unavailable."}
          </CardContent>
        </Card>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const actorLabel =
              notification.actor?.display_name ??
              (notification.actor?.username ? `@${notification.actor.username}` : "Someone");

            return (
              <Card
                key={notification.id}
                className={cn(
                  "overflow-hidden border-border/30 py-0 transition-colors",
                  !notification.read_at && "border-foreground/20 bg-card/80",
                )}
              >
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
                      {notification.actor?.avatar_url ? (
                        <Image
                          src={notification.actor.avatar_url}
                          alt={actorLabel}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {!notification.read_at ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-foreground" />
                        ) : null}
                        <p className="text-sm font-medium leading-6 text-foreground">
                          {notificationMessage(notification)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{notificationTimestamp(notification.created_at)}</span>
                        {notification.review?.entity_artist_name ? (
                          <>
                            <span>•</span>
                            <span>{notification.review.entity_artist_name}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link href={notificationHref(notification)}>
                          <Button size="sm" variant="outline" className="gap-2">
                            Open context
                            <ChevronRight className="size-4" />
                          </Button>
                        </Link>

                        {!notification.read_at ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-2"
                            disabled={isMarkingAsRead}
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="size-4" />
                            Mark as read
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <Bell className="mx-auto size-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                When someone likes or comments on one of your reviews, it will show up here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
