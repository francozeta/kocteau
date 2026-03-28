import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import UserAvatar from "@/components/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import ReviewCard from "@/components/review-card";
import { createPageMetadata, createProfileDescription } from "@/lib/metadata";
import {
  getSavedReviewsForUser,
  getViewerBookmarkedReviewIds,
} from "@/lib/queries/review-bookmarks";
import {
  getViewerLikedReviewIds,
  runReviewListQuery,
  runReviewMaybeQuery,
} from "@/lib/queries/review-likes";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type ReviewEntity = {
  id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
};

type ReviewWithEntity = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  entities: ReviewEntity | ReviewEntity[] | null;
};

function getEntity(review: ReviewWithEntity) {
  if (Array.isArray(review.entities)) {
    return review.entities[0] ?? null;
  }

  return review.entities;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await supabaseServer();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    return createPageMetadata({
      title: `@${username}`,
      description: `Profile for @${username} on Kocteau.`,
      path: `/u/${username}`,
    });
  }

  const title = profile.display_name
    ? `${profile.display_name} (@${profile.username})`
    : `@${profile.username}`;

  return createPageMetadata({
    title,
    description: createProfileDescription(
      profile.username,
      profile.display_name,
      profile.bio,
    ),
    path: `/u/${profile.username}`,
    image: profile.avatar_url,
  });
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = await supabaseServer();

  // 1) Upload public profile by username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, spotify_url, apple_music_url, deezer_url, created_at")
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  const name = profile.display_name ?? `@${profile.username}`;

  // 2) Search pinned review
  const pinnedReview = await runReviewMaybeQuery<ReviewWithEntity>(async (mode) =>
    supabase
      .from("reviews")
      .select([
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
      ].join(","))
      .eq("author_id", profile.id)
      .eq("is_pinned", true)
      .maybeSingle<ReviewWithEntity>(),
  );

  // 3) Search for other reviews
  const reviews = await runReviewListQuery<ReviewWithEntity>(async (mode) =>
    supabase
      .from("reviews")
      .select([
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
      ].join(","))
      .eq("author_id", profile.id)
      .eq("is_pinned", false)
      .order("created_at", { ascending: false }),
  );

  const totalReviews = (reviews?.length || 0) + (pinnedReview ? 1 : 0);
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;
  const likedReviewIds = await getViewerLikedReviewIds(
    supabase,
    user?.id,
    [
      ...(pinnedReview ? [pinnedReview.id] : []),
      ...((reviews ?? []).map((review) => review.id)),
    ],
  );
  const bookmarkedReviewIds = await getViewerBookmarkedReviewIds(
    supabase,
    user?.id,
    [
      ...(pinnedReview ? [pinnedReview.id] : []),
      ...((reviews ?? []).map((review) => review.id)),
    ],
  );
  const savedReviews = isOwnProfile && user?.id
    ? await getSavedReviewsForUser(supabase, user.id)
    : [];
  const savedReviewIds = savedReviews
    .map((savedReview) => savedReview.review?.id)
    .filter((reviewId): reviewId is string => Boolean(reviewId));
  const likedSavedReviewIds = await getViewerLikedReviewIds(
    supabase,
    user?.id,
    savedReviewIds,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      <section className="border-b border-border/30 pb-8">
        <div className="grid gap-6 lg:grid-cols-[8.5rem,minmax(0,1fr),14rem] lg:items-end">
          <UserAvatar
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            username={profile.username}
            className="h-28 w-28 border-border/20 sm:h-32 sm:w-32"
            fallbackClassName="text-3xl font-semibold sm:text-4xl"
            initialsLength={2}
          />

          <div className="min-w-0 space-y-4">
            <div className="space-y-1.5">
              <h1 className="font-serif text-4xl font-bold leading-tight text-balance sm:text-[3.35rem]">
                {name}
              </h1>
              <p className="text-base text-muted-foreground">@{profile.username}</p>
            </div>
            {profile.bio ? (
              <p className="text-base leading-relaxed text-foreground/85 max-w-2xl">
                {profile.bio}
              </p>
            ) : null}
            {profile.spotify_url || profile.apple_music_url || profile.deezer_url ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.spotify_url ? (
                  <a
                    href={profile.spotify_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/25")}
                  >
                    Spotify
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
                {profile.apple_music_url ? (
                  <a
                    href={profile.apple_music_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/25")}
                  >
                    Apple Music
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
                {profile.deezer_url ? (
                  <a
                    href={profile.deezer_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/25")}
                  >
                    Deezer
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[1.65rem] border border-border/20 bg-card/18 p-4 text-sm lg:grid-cols-1">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Reviews
              </p>
              <p className="text-2xl font-semibold text-foreground">{totalReviews}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Joined
              </p>
              <p className="text-sm text-muted-foreground">{memberSince}</p>
            </div>

            {isOwnProfile ? (
              <div className="col-span-2 pt-1 lg:col-span-1">
                <ProfileSettingsDialog
                  profile={{
                    username: profile.username,
                    display_name: profile.display_name,
                    avatar_url: profile.avatar_url,
                    bio: profile.bio,
                    spotify_url: profile.spotify_url,
                    apple_music_url: profile.apple_music_url,
                    deezer_url: profile.deezer_url,
                  }}
                  trigger={
                    <button className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full rounded-full border-border/25")}>
                      Edit profile
                    </button>
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="space-y-8">
        {pinnedReview && (
          <div className="space-y-3">
            <div className="flex items-end justify-between border-b border-border/25 pb-4">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Pinned
              </h2>
            </div>
            <ReviewCard
              review={{
                ...pinnedReview,
                viewer_has_liked: likedReviewIds.has(pinnedReview.id),
                viewer_has_bookmarked: bookmarkedReviewIds.has(pinnedReview.id),
              }}
              entity={getEntity(pinnedReview)}
              showAuthor={false}
              featured={true}
              entityMode="full"
              isAuthenticated={Boolean(user)}
            />
          </div>
        )}

        {reviews && reviews.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-end justify-between border-b border-border/25 pb-4">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {pinnedReview ? "Recent" : "Reviews"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {reviews.length} {reviews.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={{
                    ...(review as ReviewWithEntity),
                    viewer_has_liked: likedReviewIds.has(review.id),
                    viewer_has_bookmarked: bookmarkedReviewIds.has(review.id),
                  }}
                  entity={getEntity(review as ReviewWithEntity)}
                  showAuthor={false}
                  entityMode="inline"
                  isAuthenticated={Boolean(user)}
                />
              ))}
            </div>
          </section>
        ) : !pinnedReview ? (
          <Empty className="rounded-[1.65rem] border-border/20 bg-card/18 px-6 py-10">
            <EmptyHeader>
              <EmptyTitle>No reviews yet</EmptyTitle>
              <EmptyDescription>
                Nothing published here yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {isOwnProfile ? (
          <section className="space-y-4 border-t border-border/30 pt-8">
            <div className="flex items-end justify-between border-b border-border/25 pb-4">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Saved
              </h2>
              <p className="text-sm text-muted-foreground">
                {savedReviews.length} {savedReviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>

            {savedReviews.length > 0 ? (
              <div className="space-y-4">
                {savedReviews.map((savedReview) => {
                  if (!savedReview.review) {
                    return null;
                  }

                  const reviewAuthor = Array.isArray(savedReview.review.author)
                    ? savedReview.review.author[0] ?? null
                    : savedReview.review.author;
                  const reviewEntity = Array.isArray(savedReview.review.entities)
                    ? savedReview.review.entities[0] ?? null
                    : savedReview.review.entities;

                  return (
                    <ReviewCard
                      key={savedReview.review.id}
                      review={{
                        ...savedReview.review,
                        viewer_has_liked: likedSavedReviewIds.has(savedReview.review.id),
                        viewer_has_bookmarked: true,
                      }}
                      entity={reviewEntity}
                      author={reviewAuthor}
                      showAuthor={true}
                      entityMode="inline"
                      eyebrow="Saved for later"
                      isAuthenticated={Boolean(user)}
                      bookmarkRefreshOnToggle={true}
                    />
                  );
                })}
              </div>
            ) : (
              <Empty className="rounded-[1.65rem] border-border/20 bg-card/18 px-6 py-9">
                <EmptyHeader>
                  <EmptyTitle>No saved reviews</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
