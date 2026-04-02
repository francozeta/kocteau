"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
  hasInitialNotificationsData?: boolean;
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

type MarkAllAsReadResponse = {
  readAt: string;
  unreadCount: number;
};

export function notificationsListKey(limit: number) {
  return ["notifications", "list", limit] as const;
}

export const notificationsUnreadCountKey = ["notifications", "unread-count"] as const;
const notificationsListPrefix = ["notifications", "list"] as const;
const NOTIFICATIONS_STALE_MS = 60_000;
const UNREAD_FALLBACK_POLL_MS = 45_000;

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
  hasInitialNotificationsData = true,
  limit = 25,
  subscribe = false,
  enableList = true,
}: UseNotificationsOptions) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const listKey = useMemo(() => notificationsListKey(limit), [limit]);
  const processedRealtimeIdsRef = useRef<Set<string>>(new Set());
  const activeChannelRef = useRef<RealtimeChannel | null>(null);
  const latestAccessTokenRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    staleTime: NOTIFICATIONS_STALE_MS,
    gcTime: 10 * 60_000,
    refetchInterval:
      userId && !subscribe ? UNREAD_FALLBACK_POLL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: Boolean(subscribe),
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
    initialData: hasInitialNotificationsData ? initialNotifications : undefined,
    staleTime: NOTIFICATIONS_STALE_MS,
    gcTime: 10 * 60_000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
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

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; readAt?: string; unreadCount?: number }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "We couldn't update notifications right now.",
        );
      }

      return {
        readAt: payload?.readAt ?? new Date().toISOString(),
        unreadCount: payload?.unreadCount ?? 0,
      } satisfies MarkAllAsReadResponse;
    },
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: notificationsListPrefix }),
        queryClient.cancelQueries({ queryKey: notificationsUnreadCountKey }),
      ]);

      const previousLists = getCachedNotificationLists();
      const previousUnreadCount =
        queryClient.getQueryData<number>(notificationsUnreadCountKey) ?? initialUnreadCount;
      const optimisticReadAt = new Date().toISOString();

      patchAllNotificationLists((current) =>
        current.map((item) =>
          item.read_at
            ? item
            : {
                ...item,
                read_at: optimisticReadAt,
              },
        ),
      );
      queryClient.setQueryData<number>(notificationsUnreadCountKey, 0);

      return { previousLists, previousUnreadCount };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
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
          item.read_at
            ? item
            : {
                ...item,
                read_at: result.readAt,
              },
        ),
      );
      queryClient.setQueryData<number>(
        notificationsUnreadCountKey,
        result.unreadCount,
      );
      void queryClient.invalidateQueries({
        queryKey: notificationsUnreadCountKey,
        exact: true,
      });
    },
  });

  useEffect(() => {
    if (!subscribe || !userId) {
      return;
    }

    const recipientId = userId;
    let disposed = false;

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

    function clearReconnectTimeout() {
      if (!reconnectTimeoutRef.current) {
        return;
      }

      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    async function removeActiveChannel() {
      clearReconnectTimeout();

      if (!activeChannelRef.current) {
        return;
      }

      const channel = activeChannelRef.current;
      activeChannelRef.current = null;
      await supabase.removeChannel(channel);
    }

    async function setRealtimeAuth(accessToken?: string | null) {
      latestAccessTokenRef.current = accessToken ?? null;

      if (!accessToken) {
        return;
      }

      await supabase.realtime.setAuth(accessToken);
    }

    function scheduleReconnect() {
      if (disposed || reconnectTimeoutRef.current) {
        return;
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;

        if (disposed) {
          return;
        }

        void ensureChannel(latestAccessTokenRef.current);
      }, 750);
    }

    async function ensureChannel(accessToken?: string | null) {
      if (disposed) {
        return;
      }

      await setRealtimeAuth(accessToken);

      if (disposed || activeChannelRef.current) {
        return;
      }

      if (disposed || activeChannelRef.current) {
        return;
      }

      const channel = supabase.channel(notificationChannelTopic(recipientId), {
        config: { private: true },
      });

      activeChannelRef.current = channel;

      channel
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
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            void removeActiveChannel().then(() => {
              scheduleReconnect();
            });
          }
        });
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (disposed) {
        return;
      }

      void ensureChannel(data.session?.access_token);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (disposed) {
        return;
      }

      if (session?.access_token) {
        void ensureChannel(session.access_token);
        return;
      }

      latestAccessTokenRef.current = null;
      void removeActiveChannel();
    });

    return () => {
      disposed = true;
      clearReconnectTimeout();
      subscription.unsubscribe();
      void removeActiveChannel();
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
    isFetchingNotifications: notificationsQuery.isFetching,
    isNotificationsError: notificationsQuery.isError,
    notificationsError: notificationsQuery.error,
    isLoadingUnreadCount: unreadQuery.isLoading,
    markAsRead: markAsRead.mutateAsync,
    isMarkingAsRead: markAsRead.isPending,
    markAllAsRead: markAllAsRead.mutateAsync,
    isMarkingAllAsRead: markAllAsRead.isPending,
  };
}
