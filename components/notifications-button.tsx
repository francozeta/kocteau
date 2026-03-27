"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationItem } from "@/lib/notifications";
import NotificationList from "@/components/notification-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(false);
  const hasAutoMarkedRef = useRef(false);
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
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
    subscribe: true,
    enableList: true,
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
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't update notifications right now.",
      );
    });
  }, [markAllAsRead, open, unreadCount]);

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full border border-border/40 bg-background/65 text-muted-foreground shadow-none transition-colors hover:bg-muted/40 hover:text-foreground",
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
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold leading-none text-background shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[23rem] gap-0 rounded-3xl border-border/45 bg-popover/96 p-0 shadow-2xl sm:w-[25rem]"
        sideOffset={12}
      >
        <PopoverHeader className="border-b border-border/35 px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <PopoverTitle className="text-sm font-medium">Notifications</PopoverTitle>
              <PopoverDescription className="text-xs">
                {unreadCount > 0
                  ? `${unreadCount} unread right now`
                  : "You’re all caught up"}
              </PopoverDescription>
            </div>
            <Link
              href="/notifications"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>
        </PopoverHeader>

        <ScrollArea className="max-h-[28rem]">
          <div className="p-2.5">
            {isLoadingNotifications ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : isNotificationsError ? (
              <Alert className="rounded-2xl border-border/40 bg-card/50 p-3">
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
              <Empty className="rounded-3xl border-border/35 bg-card/35 px-4 py-9">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bell className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No notifications yet</EmptyTitle>
                  <EmptyDescription>
                    Likes and comments on your reviews will land here first.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
