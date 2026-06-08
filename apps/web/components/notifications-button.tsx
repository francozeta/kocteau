"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BellSimpleIcon } from "@/components/ui/icons";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationItem } from "@/lib/notifications";
import NotificationList from "@/components/notification-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toastActionError } from "@/lib/feedback";

type NotificationsButtonProps = {
  userId: string;
  initialUnreadCount: number;
  initialNotifications: NotificationItem[];
  triggerClassName?: string;
  contentClassName?: string;
  contentAlign?: "start" | "center" | "end";
  contentSide?: "top" | "right" | "bottom" | "left";
  contentSideOffset?: number;
};

export default function NotificationsButton({
  userId,
  initialUnreadCount,
  initialNotifications,
  triggerClassName,
  contentClassName,
  contentAlign = "end",
  contentSide,
  contentSideOffset = 12,
}: NotificationsButtonProps) {
  const [open, setOpen] = useState(false);
  const hasAutoMarkedRef = useRef(false);
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    isFetchingNotifications,
    isNotificationsError,
    notificationsError,
    markAsRead,
    isMarkingAsRead,
    markAllAsRead,
  } = useNotifications({
    userId,
    initialUnreadCount,
    initialNotifications,
    limit: 8,
    hasInitialNotificationsData: false,
    subscribe: true,
    enableList: open,
  });

  useEffect(() => {
    if (!open) {
      hasAutoMarkedRef.current = false;
      return;
    }

    if (unreadCount <= 0 || hasAutoMarkedRef.current) {
      return;
    }

    hasAutoMarkedRef.current = true;

    void markAllAsRead().catch((error) => {
      hasAutoMarkedRef.current = false;
      toastActionError(error, "We couldn't update notifications right now.");
    });
  }, [markAllAsRead, open, unreadCount]);

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      toastActionError(error, "We couldn't update that notification right now.");
    }
  }

  const showViewAll = notifications.length >= 5 || unreadCount > notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-[0.68rem] border border-border/46 bg-card/18 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:bg-muted/40 hover:text-foreground md:border-border/40 md:bg-background/65",
            triggerClassName,
            unreadCount > 0 && "text-foreground",
          )}
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <BellSimpleIcon className="size-4" weight={unreadCount > 0 ? "fill" : "regular"} />
          {unreadCount > 0 ? (
            <span
              className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-foreground shadow-[0_0_0_2px_var(--sidebar)]"
              aria-hidden="true"
            />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={contentAlign}
        side={contentSide}
        className={cn(
          "w-[23rem] gap-0 overflow-hidden rounded-[1rem] border-border/44 bg-popover p-0 shadow-none sm:w-[25rem] md:border-border/35 md:bg-popover",
          contentClassName,
        )}
        sideOffset={contentSideOffset}
      >
        <PopoverHeader className="border-b border-sidebar-border/60 px-3 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <PopoverTitle className="text-[13px] font-medium text-sidebar-foreground">Activity</PopoverTitle>
              {unreadCount > 0 ? (
                <PopoverDescription className="truncate text-[11px] text-sidebar-foreground/58">
                  {unreadCount} unread
                </PopoverDescription>
              ) : null}
            </div>
            {showViewAll ? (
              <Link
                href="/notifications"
                className="shrink-0 pt-0.5 text-[11px] font-medium text-sidebar-foreground/58 transition-colors hover:text-sidebar-foreground"
              >
                View all
              </Link>
            ) : null}
          </div>
        </PopoverHeader>

        <ScrollArea className="min-h-40 max-h-[24rem]">
          <div>
            {isLoadingNotifications ? (
              <div className="flex min-h-40 items-center justify-center px-3 py-7">
                <Spinner className="size-5 text-muted-foreground/70" />
              </div>
            ) : isFetchingNotifications && notifications.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center px-3 py-7">
                <Spinner className="size-5 text-muted-foreground/70" />
              </div>
            ) : isNotificationsError ? (
              <Alert className="rounded-[0.64rem] border-border/46 bg-card p-3 shadow-none md:border-border/40 md:bg-card">
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
                compact
                isMarkingAsRead={isMarkingAsRead}
                onMarkAsRead={handleMarkAsRead}
              />
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-9 text-center">
                <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground/62">
                  <BellSimpleIcon className="size-4" />
                </span>
                <p className="text-[13px] font-medium text-sidebar-foreground">
                  No notifications yet
                </p>
                <p className="max-w-[16rem] text-[11px] text-sidebar-foreground/58 text-balance">
                  New likes and replies to your reviews will appear here.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
