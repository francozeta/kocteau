import { normalizeRelation } from "@/lib/queries/normalize-relation";

export type NotificationType = "review_liked" | "review_commented";

type NestedMaybe<T> = T | T[] | null;

export type NotificationActor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type NotificationReview = {
  id: string | null;
  title: string | null;
  entity_id: string | null;
  entity_title: string | null;
  entity_artist_name: string | null;
};

export type NotificationComment = {
  id: string;
  body: string | null;
};

export type NotificationItem = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  review_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: NotificationActor | null;
  review: NotificationReview | null;
  comment: NotificationComment | null;
};

export type GroupedNotificationItem =
  | {
      kind: "single";
      notification: NotificationItem;
    }
  | {
      kind: "like-group";
      id: string;
      reviewId: string | null;
      notifications: NotificationItem[];
      primary: NotificationItem;
      othersCount: number;
    };

type NotificationRecord = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  review_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: NotificationActor | NotificationActor[] | null;
  review: NestedMaybe<{
    id: string | null;
    title: string | null;
    entities:
      | {
          id: string;
          title: string;
          artist_name: string | null;
        }
      | Array<{
          id: string;
          title: string;
          artist_name: string | null;
        }>
      | null;
  }>;
  comment: NestedMaybe<NotificationComment>;
};

export function notificationChannelTopic(recipientId: string) {
  return `notifications:user:${recipientId}`;
}

export function normalizeNotification(record: NotificationRecord): NotificationItem {
  const actor = normalizeRelation(record.actor);
  const review = normalizeRelation(record.review);
  const comment = normalizeRelation(record.comment);
  const entity = normalizeRelation(review?.entities);

  return {
    id: record.id,
    recipient_id: record.recipient_id,
    actor_id: record.actor_id,
    type: record.type,
    review_id: record.review_id,
    comment_id: record.comment_id,
    read_at: record.read_at,
    created_at: record.created_at,
    actor,
    review: review
      ? {
          id: review.id,
          title: review.title,
          entity_id: entity?.id ?? null,
          entity_title: entity?.title ?? null,
          entity_artist_name: entity?.artist_name ?? null,
        }
      : null,
    comment,
  };
}

export function notificationHref(notification: NotificationItem) {
  if (notification.review?.entity_id && notification.review_id) {
    return `/track/${notification.review.entity_id}#review-${notification.review_id}`;
  }

  if (notification.review?.entity_id) {
    return `/track/${notification.review.entity_id}`;
  }

  if (notification.actor?.username) {
    return `/u/${notification.actor.username}`;
  }

  return "/notifications";
}

export function notificationMessage(notification: NotificationItem) {
  const actorName =
    notification.actor?.display_name ??
    (notification.actor?.username ? `@${notification.actor.username}` : "Someone");
  const targetTitle =
    notification.review?.entity_title ?? notification.review?.title ?? "your review";

  if (notification.type === "review_liked") {
    return `${actorName} liked your review on ${targetTitle}.`;
  }

  return `${actorName} commented on your review of ${targetTitle}.`;
}

export function notificationTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function groupNotifications(
  notifications: NotificationItem[],
): GroupedNotificationItem[] {
  const grouped: GroupedNotificationItem[] = [];
  const likeGroups = new Map<string, number>();

  notifications.forEach((notification) => {
    if (notification.type !== "review_liked" || !notification.review_id) {
      grouped.push({
        kind: "single",
        notification,
      });
      return;
    }

    const existingIndex = likeGroups.get(notification.review_id);

    if (existingIndex === undefined) {
      grouped.push({
        kind: "like-group",
        id: `like-group:${notification.review_id}`,
        reviewId: notification.review_id,
        notifications: [notification],
        primary: notification,
        othersCount: 0,
      });
      likeGroups.set(notification.review_id, grouped.length - 1);
      return;
    }

    const existing = grouped[existingIndex];

    if (!existing || existing.kind !== "like-group") {
      return;
    }

    existing.notifications.push(notification);
    existing.othersCount = existing.notifications.length - 1;
  });

  return grouped;
}
