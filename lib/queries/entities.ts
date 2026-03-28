import "server-only";

import { unstable_cache } from "next/cache";
import { runReviewListQuery } from "@/lib/queries/review-likes";
import { supabasePublic } from "@/lib/supabase/public";
import { supabaseServer } from "@/lib/supabase/server";
import { getViewerBookmarkedReviewIds } from "@/lib/queries/review-bookmarks";
import { getViewerLikedReviewIds } from "@/lib/queries/review-likes";
import type {
  ReviewCardAuthor,
  ReviewCardData,
} from "@/components/review-card";

export type EntityPage = {
  id: string;
  provider: string;
  provider_id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  type: "track" | "album";
};

export type ExistingEntity = {
  id: string;
};

export type EntityReview = {
  id: ReviewCardData["id"];
  title: ReviewCardData["title"];
  body: ReviewCardData["body"];
  rating: ReviewCardData["rating"];
  likes_count: ReviewCardData["likes_count"];
  comments_count: ReviewCardData["comments_count"];
  created_at: ReviewCardData["created_at"];
  is_pinned: boolean;
  author: ReviewCardAuthor | ReviewCardAuthor[] | null;
};

function reviewSelect(mode: "all" | "likes-only" | "base") {
  return [
    "id",
    "title",
    "body",
    "rating",
    ...(mode !== "base" ? ["likes_count"] : []),
    ...(mode === "all" ? ["comments_count"] : []),
    "created_at",
    "is_pinned",
    `author:profiles!reviews_author_id_fkey (
      username,
      display_name,
      avatar_url
    )`,
  ].join(",");
}

export async function getEntityPageById(entityId: string) {
  return unstable_cache(
    async () => {
      const supabase = supabasePublic();

      const { data, error } = await supabase
        .from("entities")
        .select("id, provider, provider_id, title, artist_name, cover_url, deezer_url, type")
        .eq("id", entityId)
        .maybeSingle<EntityPage>();

      if (error) {
        return null;
      }

      return data;
    },
    ["entity-page", entityId],
    {
      revalidate: 120,
      tags: ["entities", `entity:${entityId}`],
    },
  )();
}

export async function findEntityByProvider(
  provider: string,
  type: EntityPage["type"],
  providerId: string,
) {
  return unstable_cache(
    async () => {
      const supabase = supabasePublic();

      const { data, error } = await supabase
        .from("entities")
        .select("id")
        .eq("provider", provider)
        .eq("type", type)
        .eq("provider_id", providerId)
        .maybeSingle<ExistingEntity>();

      if (error) {
        return null;
      }

      return data;
    },
    ["entity-by-provider", provider, type, providerId],
    {
      revalidate: 120,
      tags: ["entities", `entity-provider:${provider}:${type}:${providerId}`],
    },
  )();
}

export async function getReviewsForEntity(entityId: string) {
  return unstable_cache(
    async () => {
      const supabase = supabasePublic();

      const reviews = await runReviewListQuery<EntityReview>(async (mode) =>
        supabase
          .from("reviews")
          .select(reviewSelect(mode))
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false }),
      );

      return reviews.map((review) => ({
        ...review,
        is_pinned: Boolean(review.is_pinned),
      }));
    },
    ["entity-reviews", entityId],
    {
      revalidate: 60,
      tags: ["reviews", `entity:${entityId}:reviews`],
    },
  )();
}

export async function getTrackPageBundle(
  entityId: string,
  viewerId?: string | null,
) {
  const [entity, reviews] = await Promise.all([
    getEntityPageById(entityId),
    getReviewsForEntity(entityId),
  ]);

  if (!entity) {
    return null;
  }

  if (!viewerId || reviews.length === 0) {
    return {
      entity,
      reviews,
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
    };
  }

  const supabase = await supabaseServer();
  const reviewIds = reviews.map((review) => review.id);
  const [likedReviewIds, bookmarkedReviewIds] = await Promise.all([
    getViewerLikedReviewIds(supabase, viewerId, reviewIds),
    getViewerBookmarkedReviewIds(supabase, viewerId, reviewIds),
  ]);

  return {
    entity,
    reviews,
    likedReviewIds,
    bookmarkedReviewIds,
  };
}
