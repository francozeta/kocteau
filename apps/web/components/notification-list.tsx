"use client";

import Link from "next/link";
import {
  CheckIcon,
  ChatCircleTextIcon,
  HeartIcon,
} from "@phosphor-icons/react";
import {
  groupNotifications,
  notificationHref,
  notificationTimestamp,
  type GroupedNotificationItem,
  type NotificationItem,
} from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/user-avatar";
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

export default function NotificationList({
  notifications,
  compact = false,
  isMarkingAsRead = false,
  onMarkAsRead,
}: NotificationListProps) {
  const entries = groupNotifications(notifications);

  return (
    <div
      className={cn(
        compact ? "space-y-0.5 p-1.5" : "divide-y divide-border/25 overflow-hidden rounded-[1.55rem] border border-border/30 bg-card/18",
      )}
    >
      {entries.map((entry) => {
        const notification = entry.kind === "single" ? entry.notification : entry.primary;
        const actorLabel = getActorLabel(notification);
        const timestamp = notificationTimestamp(notification.created_at);
        const unread = entry.kind === "single"
          ? !notification.read_at
          : entry.notifications.some((item) => !item.read_at);
        const href = notificationHref(notification);
        const body = getGroupedBody(entry);

        if (compact) {
          return (
            <Link
              key={entry.kind === "single" ? notification.id : entry.id}
              href={href}
              className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[0.56rem] px-2 py-2.5 text-left transition-colors hover:bg-sidebar-accent/58"
            >
              <UserAvatar
                avatarUrl={notification.actor?.avatar_url}
                displayName={notification.actor?.display_name ?? null}
                username={notification.actor?.username ?? null}
                size="sm"
              />
              <p className="min-w-0 truncate text-[12px] leading-5 text-sidebar-foreground/62">
                {entry.kind === "single" ? (
                  <>
                    {unread ? (
                      <span className="mr-1.5 inline-flex size-1.5 translate-y-[-1px] rounded-full bg-sidebar-foreground" />
                    ) : null}
                    <span className="font-medium text-sidebar-foreground/88">
                      {actorLabel}
                    </span>{" "}
                    {body}
                  </>
                ) : (
                  <>
                    {unread ? (
                      <span className="mr-1.5 inline-flex size-1.5 translate-y-[-1px] rounded-full bg-sidebar-foreground" />
                    ) : null}
                    {body}
                  </>
                )}
              </p>
              <span className="text-[11px] text-sidebar-foreground/42">
                {timestamp}
              </span>
            </Link>
          );
        }

        return (
          <div
            key={entry.kind === "single" ? notification.id : entry.id}
            className={cn(
              "group relative flex gap-3 transition-colors hover:bg-muted/14",
              compact ? "rounded-[0.68rem] px-2.5 py-2.5" : "px-4 py-4",
            )}
          >
            <div className="pt-0.5">
              <UserAvatar
                avatarUrl={notification.actor?.avatar_url}
                displayName={notification.actor?.display_name ?? null}
                username={notification.actor?.username ?? null}
                size={compact ? "sm" : "default"}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 text-[13px]">
                    {unread ? (
                      <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    ) : null}
                    <span className="truncate font-medium text-foreground">
                      {actorLabel}
                    </span>
                    {notification.type === "review_liked" ? (
                      <HeartIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChatCircleTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-[12.5px] leading-5 text-foreground/72">
                    {body}
                  </p>
                </div>
                <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">
                  {timestamp}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <Button asChild variant="ghost" size="sm" className="h-6 rounded-[0.46rem] px-2 text-[11px] text-muted-foreground hover:text-foreground">
                  <Link href={href}>
                    Open
                  </Link>
                </Button>

                {unread ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 rounded-[0.46rem] px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    disabled={isMarkingAsRead}
                    onClick={() => {
                      if (entry.kind === "single") {
                        onMarkAsRead(notification.id);
                        return;
                      }

                      entry.notifications.forEach((item) => onMarkAsRead(item.id));
                    }}
                  >
                    <CheckIcon className="size-3.5" />
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
