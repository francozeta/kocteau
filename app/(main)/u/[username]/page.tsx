import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import ReviewCard from "@/components/review-card";
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
    <div className="space-y-10">
      <section className="space-y-6 border-b border-border/30 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-muted border border-border/30">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={name}
                fill
                sizes="128px"
                className="object-cover object-center"
                quality={75}
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight text-balance">
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
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-border/30")}
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
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-border/30")}
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
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-border/30")}
                  >
                    Deezer
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">{totalReviews}</span>
                {totalReviews === 1 ? "review" : "reviews"}
              </div>
              <span className="text-muted-foreground/50">•</span>
              <span>Joined {memberSince}</span>
            </div>
            {isOwnProfile ? (
              <div className="pt-2">
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
                    <button className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-border/30")}>
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
            <h2 className="font-serif text-2xl font-bold">Pinned review</h2>
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
            <h2 className="font-serif text-2xl font-bold">{pinnedReview ? "More reviews" : "Reviews"}</h2>
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
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-base">No reviews yet</p>
          </div>
        ) : null}

        {isOwnProfile ? (
          <section className="space-y-4 border-t border-border/30 pt-8">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold">Saved reviews</h2>
              <p className="text-sm text-muted-foreground">
                Private to you. Keep strong reviews close and come back later.
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
              <div className="rounded-xl border border-border/30 bg-card/40 p-6 text-sm text-muted-foreground">
                Save reviews from the feed, track pages, or profiles and they will show up here.
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
