import { cache } from "react";
import {
  runReviewListQuery,
  runReviewMaybeQuery,
} from "@/lib/queries/review-likes";
import { supabaseServer } from "@/lib/supabase/server";

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
  created_at: string;
};

export type ProfileReviewEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
};

export type ProfileReview = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  entities: ProfileReviewEntity | ProfileReviewEntity[] | null;
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
    `entities (
      id,
      title,
      artist_name,
      cover_url
    )`,
  ].join(",");
}

export const getPublicProfileByUsername = cache(async (username: string) => {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, spotify_url, apple_music_url, deezer_url, created_at")
    .eq("username", username)
    .maybeSingle<PublicProfile>();

  if (error) {
    return null;
  }

  return data;
});

export const getPinnedReviewForProfile = cache(async (authorId: string) => {
  const supabase = await supabaseServer();

  return runReviewMaybeQuery<ProfileReview>(async (mode) =>
    supabase
      .from("reviews")
      .select(reviewSelect(mode))
      .eq("author_id", authorId)
      .eq("is_pinned", true)
      .maybeSingle<ProfileReview>(),
  );
});

export const getRecentReviewsForProfile = cache(async (authorId: string) => {
  const supabase = await supabaseServer();

  return runReviewListQuery<ProfileReview>(async (mode) =>
    supabase
      .from("reviews")
      .select(reviewSelect(mode))
      .eq("author_id", authorId)
      .eq("is_pinned", false)
      .order("created_at", { ascending: false }),
  );
});
