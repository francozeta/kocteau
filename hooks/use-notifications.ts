"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notificationChannelTopic,
  type NotificationItem,
} from "@/lib/notifications";
import { supabaseBrowser } from "@/lib/supabase/client";

type UseNotificationsOptions = {
  userId: string | null;
  initialNotifications?: NotificationItem[];
  initialUnreadCount?: number;
  limit?: number;
  subscribe?: boolean;
  enableList?: boolean;
};

type NotificationRealtimeEnvelope = {
  notification?: NotificationItem;
};

type MarkAsReadResponse = {
  notificationId: string;
  readAt: string | null;
  unreadCount: number;
};

export function notificationsListKey(limit: number) {
  return ["notifications", "list", limit] as const;
}

export const notificationsUnreadCountKey = ["notifications", "unread-count"] as const;
const notificationsListPrefix = ["notifications", "list"] as const;

function upsertNotification(
  current: NotificationItem[],
  notification: NotificationItem,
  limit: number,
) {
  const withoutExisting = current.filter((item) => item.id !== notification.id);
  return [notification, ...withoutExisting].slice(0, limit);
}

function readRealtimeEnvelope(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate =
    "payload" in payload &&
    payload.payload &&
    typeof payload.payload === "object"
      ? (payload.payload as Record<string, unknown>)
      : (payload as Record<string, unknown>);

  const notification = candidate.notification;

  if (!notification || typeof notification !== "object") {
    return null;
  }

  return {
    notification: notification as NotificationItem,
  } satisfies NotificationRealtimeEnvelope;
}

export function useNotifications({
  userId,
  initialNotifications = [],
  initialUnreadCount = 0,
  limit = 25,
  subscribe = false,
  enableList = true,
}: UseNotificationsOptions) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const listKey = useMemo(() => notificationsListKey(limit), [limit]);
  const processedRealtimeIdsRef = useRef<Set<string>>(new Set());

  const getCachedNotificationLists = useCallback(() => {
    return queryClient.getQueriesData<NotificationItem[]>({
      queryKey: notificationsListPrefix,
    });
  }, [queryClient]);

  const patchAllNotificationLists = useCallback((
    updater: (current: NotificationItem[], queryLimit: number) => NotificationItem[],
  ) => {
    const cachedLists = getCachedNotificationLists();

    cachedLists.forEach(([queryKey]) => {
      const queryLimit =
        Array.isArray(queryKey) && typeof queryKey[2] === "number"
          ? queryKey[2]
          : limit;

      queryClient.setQueryData<NotificationItem[]>(
        queryKey,
        (current = []) => updater(current, queryLimit),
      );
    });
  }, [getCachedNotificationLists, limit, queryClient]);

  const unreadQuery = useQuery({
    queryKey: notificationsUnreadCountKey,
    queryFn: async () => {
      const response = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });

      if (response.status === 503) {
        return 0;
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; unreadCount?: number }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "We couldn't load notifications right now.",
        );
      }

      return payload?.unreadCount ?? 0;
    },
    enabled: Boolean(userId),
    initialData: initialUnreadCount,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });

  const notificationsQuery = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      const response = await fetch(`/api/notifications?limit=${limit}`, {
        cache: "no-store",
      });

      if (response.status === 503) {
        return [] as NotificationItem[];
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; notifications?: NotificationItem[] }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "We couldn't load notifications right now.",
        );
      }

      return Array.isArray(payload?.notifications) ? payload.notifications : [];
    },
    enabled: Boolean(userId) && enableList,
    initialData: initialNotifications,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; notificationId?: string; readAt?: string | null; unreadCount?: number }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "We couldn't update that notification right now.",
        );
      }

      return {
        notificationId: payload?.notificationId ?? notificationId,
        readAt: payload?.readAt ?? new Date().toISOString(),
        unreadCount: payload?.unreadCount ?? 0,
      } satisfies MarkAsReadResponse;
    },
    onMutate: async (notificationId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: notificationsUnreadCountKey }),
      ]);

      const previousNotifications =
        queryClient.getQueryData<NotificationItem[]>(listKey) ?? initialNotifications;
      const previousUnreadCount =
        queryClient.getQueryData<number>(notificationsUnreadCountKey) ?? initialUnreadCount;
      const previousLists = getCachedNotificationLists();
      const target = previousNotifications.find((item) => item.id === notificationId);

      patchAllNotificationLists((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                read_at: item.read_at ?? new Date().toISOString(),
              }
            : item,
        ),
      );

      if (target && !target.read_at) {
        queryClient.setQueryData<number>(
          notificationsUnreadCountKey,
          Math.max(previousUnreadCount - 1, 0),
        );
      }

      return { previousNotifications, previousUnreadCount, previousLists };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      } else if (context?.previousNotifications) {
        queryClient.setQueryData(listKey, context.previousNotifications);
      }

      if (typeof context?.previousUnreadCount === "number") {
        queryClient.setQueryData(
          notificationsUnreadCountKey,
          context.previousUnreadCount,
        );
      }
    },
    onSuccess: (result) => {
      patchAllNotificationLists((current) =>
        current.map((item) =>
          item.id === result.notificationId
            ? {
                ...item,
                read_at: result.readAt,
              }
            : item,
        ),
      );
      queryClient.setQueryData<number>(
        notificationsUnreadCountKey,
        result.unreadCount,
      );
    },
  });

  useEffect(() => {
    if (!subscribe || !userId) {
      return;
    }

    const recipientId = userId;
    let cancelled = false;
    let activeChannel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    function applyIncomingNotification(notification: NotificationItem) {
      const cachedLists = getCachedNotificationLists();
      const alreadyInCache = cachedLists.some(([, data]) =>
        (data ?? []).some((item) => item.id === notification.id),
      );
      const wasProcessed = processedRealtimeIdsRef.current.has(notification.id);

      patchAllNotificationLists((current, queryLimit) =>
        upsertNotification(current, notification, queryLimit),
      );

      if (!alreadyInCache && !wasProcessed && !notification.read_at) {
        queryClient.setQueryData<number>(
          notificationsUnreadCountKey,
          (current = 0) => current + 1,
        );
      }

      processedRealtimeIdsRef.current.add(notification.id);
    }

    async function setupChannel() {
      const { data } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (data.session?.access_token) {
        await supabase.realtime.setAuth(data.session.access_token);
      }

      const channel = supabase.channel(notificationChannelTopic(recipientId), {
        config: { private: true },
      });

      if (cancelled) {
        void supabase.removeChannel(channel);
        return;
      }

      activeChannel = channel
        .on("broadcast", { event: "notification.created" }, (payload) => {
          const envelope = readRealtimeEnvelope(payload);

          if (!envelope?.notification) {
            void queryClient.invalidateQueries({
              queryKey: notificationsUnreadCountKey,
              exact: true,
            });
            void queryClient.invalidateQueries({
              queryKey: listKey,
              exact: true,
            });
            return;
          }

          applyIncomingNotification(envelope.notification);
        })
        .subscribe();
    }

    void setupChannel();

    return () => {
      cancelled = true;
      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
      }
    };
  }, [
    getCachedNotificationLists,
    listKey,
    patchAllNotificationLists,
    queryClient,
    subscribe,
    supabase,
    userId,
  ]);

  return {
    notifications: notificationsQuery.data ?? initialNotifications,
    unreadCount: unreadQuery.data ?? initialUnreadCount,
    isLoadingNotifications: notificationsQuery.isLoading,
    isNotificationsError: notificationsQuery.isError,
    notificationsError: notificationsQuery.error,
    isLoadingUnreadCount: unreadQuery.isLoading,
    markAsRead: markAsRead.mutateAsync,
    isMarkingAsRead: markAsRead.isPending,
  };
}
