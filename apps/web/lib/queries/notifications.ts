import { normalizeNotification, type NotificationItem } from "@/lib/notifications";
import { supabaseServer } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof supabaseServer>>;
type QueryError = {
  code?: string | null;
  message?: string | null;
} | null;

type NotificationQueryRecord = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: "review_liked" | "review_commented";
  review_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor:
    | {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    | Array<{
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }>
    | null;
  review:
    | {
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
      }
    | Array<{
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
      }>
    | null;
  comment:
    | {
        id: string;
        body: string | null;
      }
    | Array<{
        id: string;
        body: string | null;
      }>
    | null;
};

export function isMissingNotificationsError(error: QueryError) {
  if (!error?.message) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST200" ||
    error.code === "PGRST201" ||
    error.code === "PGRST204" ||
    message.includes("notifications") ||
    message.includes("notification_type")
  );
}

export async function getNotificationsForUser(
  supabase: ServerSupabaseClient,
  userId: string,
  limit = 25,
) {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      recipient_id,
      actor_id,
      type,
      review_id,
      comment_id,
      read_at,
      created_at,
      actor:profiles!notifications_actor_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      review:reviews!notifications_review_id_fkey (
        id,
        title,
        entities (
          id,
          title,
          artist_name
        )
      ),
      comment:review_comments!notifications_comment_id_fkey (
        id,
        body
      )
    `)
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error && isMissingNotificationsError(error)) {
    return [] satisfies NotificationItem[];
  }

  return ((data as NotificationQueryRecord[] | null) ?? []).map(normalizeNotification);
}

export async function getUnreadNotificationsCount(
  supabase: ServerSupabaseClient,
  userId: string,
) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error && isMissingNotificationsError(error)) {
    return 0;
  }

  return count ?? 0;
}
