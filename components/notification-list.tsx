"use client";

import Link from "next/link";
import { Check, ChevronRight, Heart, MessageCircle } from "lucide-react";
import {
  groupNotifications,
  notificationHref,
  notificationTimestamp,
  type GroupedNotificationItem,
  type NotificationItem,
} from "@/lib/notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationListProps = {
  notifications: NotificationItem[];
  compact?: boolean;
  isMarkingAsRead?: boolean;
  onMarkAsRead: (notificationId: string) => void;
};

function getActorLabel(notification: NotificationItem) {
  return (
    notification.actor?.display_name ??
    (notification.actor?.username ? `@${notification.actor.username}` : "Someone")
  );
}

function getGroupedBody(entry: GroupedNotificationItem) {
  if (entry.kind === "single") {
    const notification = entry.notification;
    const track =
      notification.review?.entity_title ??
      notification.review?.title ??
      "your review";

    if (notification.type === "review_liked") {
      return `liked your take on ${track}`;
    }

    const commentPreview = notification.comment?.body?.trim();
    if (commentPreview) {
      return `commented: "${commentPreview}"`;
    }

    return `commented on your review of ${track}`;
  }

  const actorLabel = getActorLabel(entry.primary);
  const track =
    entry.primary.review?.entity_title ??
    entry.primary.review?.title ??
    "your review";

  if (entry.othersCount <= 0) {
    return `${actorLabel} liked your take on ${track}`;
  }

  return `${actorLabel} and ${entry.othersCount} others liked your take on ${track}`;
}

function getInitials(label: string) {
  return label.slice(0, 1).toUpperCase();
}

export default function NotificationList({
  notifications,
  compact = false,
  isMarkingAsRead = false,
  onMarkAsRead,
}: NotificationListProps) {
  const entries = groupNotifications(notifications);

  return (
    <div className="divide-y divide-border/35 overflow-hidden rounded-[1.35rem] border border-border/35 bg-card/30">
      {entries.map((entry) => {
        const notification = entry.kind === "single" ? entry.notification : entry.primary;
        const actorLabel = getActorLabel(notification);
        const timestamp = notificationTimestamp(notification.created_at);
        const unread = entry.kind === "single"
          ? !notification.read_at
          : entry.notifications.some((item) => !item.read_at);
        const href = notificationHref(notification);

        return (
          <div
            key={entry.kind === "single" ? notification.id : entry.id}
            className={cn(
              "group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/20",
              compact ? "px-3.5 py-3" : "px-4 py-4",
            )}
          >
            <div className="pt-0.5">
              <Avatar size={compact ? "sm" : "default"}>
                <AvatarImage src={notification.actor?.avatar_url ?? undefined} alt={actorLabel} />
                <AvatarFallback>{getInitials(actorLabel)}</AvatarFallback>
              </Avatar>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    {unread ? (
                      <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-foreground" />
                    ) : null}
                    <span className="truncate font-medium text-foreground">
                      {actorLabel}
                    </span>
                    {notification.type === "review_liked" ? (
                      <Heart className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <MessageCircle className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-foreground/72">
                    {getGroupedBody(entry)}
                  </p>
                </div>
                <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">
                  {timestamp}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Button asChild variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground">
                  <Link href={href}>
                    Open
                    <ChevronRight className="size-3.5" />
                  </Link>
                </Button>

                {unread ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    disabled={isMarkingAsRead}
                    onClick={() => {
                      if (entry.kind === "single") {
                        onMarkAsRead(notification.id);
                        return;
                      }

                      entry.notifications.forEach((item) => onMarkAsRead(item.id));
                    }}
                  >
                    <Check className="size-3.5" />
                    Mark read
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
