import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import FollowProfileButton from "@/components/follow-profile-button";
import ProfileHeroAvatar from "@/components/profile-hero-avatar";
import SavedReviewsList from "@/components/saved-reviews-list";
import type { ReviewCardAuthor } from "@/components/review-card";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import ProfileSettingsDialog from "@/components/profile-settings-dialog";
import { ProfileReviewCard } from "@/components/review-route-cards-server";
import { Spinner } from "@/components/ui/spinner";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata, createProfileDescription } from "@/lib/metadata";
import {
  getProfilePublicBundle,
  getProfileViewerState,
  getPublicProfileByUsername,
  type ProfileReview,
} from "@/lib/queries/profiles";
import { getViewerFollowsProfile } from "@/lib/queries/profile-follows";
import { getViewerSavedReviewsBundle } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";

function getEntity(review: ProfileReview) {
  if (Array.isArray(review.entities)) {
    return review.entities[0] ?? null;
  }

  return review.entities;
}

function applyViewerStateToReview(
  review: ProfileReview,
  likedReviewIds: Set<string>,
  bookmarkedReviewIds: Set<string>,
) {
  return {
    ...review,
    viewer_has_liked: likedReviewIds.has(review.id),
    viewer_has_bookmarked: bookmarkedReviewIds.has(review.id),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

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
  });
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const userPromise = getCurrentUser();
  const publicBundlePromise = getProfilePublicBundle(username);
  const [user, publicBundle] = await Promise.all([userPromise, publicBundlePromise]);

  if (!publicBundle) {
    notFound();
  }

  const { profile, pinnedReview, reviews } = publicBundle;
  const isOwnProfile = user?.id === profile.id;
  const reviewIds = [
    ...(pinnedReview ? [pinnedReview.id] : []),
    ...reviews.map((review) => review.id),
  ];
  const viewerStatePromise = getProfileViewerState(user?.id, reviewIds);
  const followingPromise =
    user?.id && !isOwnProfile
      ? getViewerFollowsProfile(user.id, profile.id)
      : Promise.resolve(false);
  const [{ likedReviewIds, bookmarkedReviewIds }, isFollowing] = await Promise.all([
    viewerStatePromise,
    followingPromise,
  ]);
  const hydratedPinnedReview = pinnedReview
    ? applyViewerStateToReview(pinnedReview, likedReviewIds, bookmarkedReviewIds)
    : null;
  const hydratedReviews = reviews.map((review) =>
    applyViewerStateToReview(review, likedReviewIds, bookmarkedReviewIds),
  );

  const totalReviews = hydratedReviews.length + (hydratedPinnedReview ? 1 : 0);
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
  const name = profile.display_name ?? `@${profile.username}`;
  const profileAuthor: ReviewCardAuthor = {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-7">
      <section className="border-b border-border/34 pb-7 md:border-border/30">
        <div className="grid gap-5 lg:grid-cols-[7.5rem,minmax(0,1fr)] lg:items-end">
          <ProfileHeroAvatar
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            username={profile.username}
            className="h-24 w-24 border-border/28 sm:h-28 sm:w-28 md:border-border/20"
            fallbackClassName="text-3xl font-semibold"
            priority
          />

          <div className="min-w-0 space-y-3.5">
            <div className="space-y-1">
              <h1 className="font-serif text-[2.7rem] font-bold leading-none text-balance sm:text-[3.15rem]">
                {name}
              </h1>
              <p className="text-[15px] text-muted-foreground">@{profile.username}</p>
            </div>
            {profile.bio ? (
              <p className="max-w-2xl text-[15px] leading-relaxed text-foreground/85">
                {profile.bio}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              <span>{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>Since {memberSince}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isOwnProfile ? (
                <FollowProfileButton
                  profileId={profile.id}
                  initialFollowing={isFollowing}
                  isAuthenticated={Boolean(user)}
                  size="sm"
                  className="px-3.5"
                />
              ) : null}
              {profile.spotify_url || profile.apple_music_url || profile.deezer_url ? (
                <>
                {profile.spotify_url ? (
                  <a
                    href={profile.spotify_url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/34 bg-card/14 md:border-border/25 md:bg-transparent")}
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
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/34 bg-card/14 md:border-border/25 md:bg-transparent")}
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
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/34 bg-card/14 md:border-border/25 md:bg-transparent")}
                  >
                    Deezer
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
                </>
              ) : null}
              {isOwnProfile ? (
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
                    <button className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/34 bg-card/14 md:border-border/25 md:bg-transparent")}>
                      Edit profile
                    </button>
                  }
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-3xl space-y-7">
        {hydratedPinnedReview ? (
          <div className="space-y-3">
            <div className="border-b border-border/32 pb-4 md:border-border/25">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Pinned
              </h2>
            </div>
            <ProfileReviewCard
              review={{
                ...hydratedPinnedReview,
              }}
              entity={getEntity(hydratedPinnedReview)}
              author={profileAuthor}
              featured
              isAuthenticated={Boolean(user)}
              canManage={isOwnProfile}
            />
          </div>
        ) : null}

        {hydratedReviews.length > 0 ? (
          <section className="space-y-3.5">
            <div className="border-b border-border/32 pb-4 md:border-border/25">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {hydratedPinnedReview ? "Recent" : "Reviews"}
              </h2>
            </div>
            <div className="space-y-4">
              {hydratedReviews.map((review) => (
                <ProfileReviewCard
                  key={review.id}
                  review={{
                    ...review,
                  }}
                  entity={getEntity(review)}
                  author={profileAuthor}
                  isAuthenticated={Boolean(user)}
                  canManage={isOwnProfile}
                />
              ))}
            </div>
          </section>
        ) : !hydratedPinnedReview ? (
          <Empty className="rounded-[1.65rem] border-border/32 bg-card/24 px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
            <EmptyHeader>
              <EmptyTitle>No reviews yet</EmptyTitle>
              <EmptyDescription>Nothing here yet.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {isOwnProfile && user?.id ? (
          <Suspense fallback={<SavedReviewsSectionFallback />}>
            <SavedReviewsSection userId={user.id} isAuthenticated={Boolean(user)} />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

async function SavedReviewsSection({
  userId,
  isAuthenticated,
}: {
  userId: string;
  isAuthenticated: boolean;
}) {
  const { reviews: savedReviews } = await getViewerSavedReviewsBundle(userId);

  return (
    <section className="space-y-4 border-t border-border/34 pt-8 [contain-intrinsic-size:720px] [content-visibility:auto] md:border-border/30">
      <div className="border-b border-border/32 pb-4 md:border-border/25">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Saved
        </h2>
      </div>

      <SavedReviewsList
        initialReviews={savedReviews}
        userId={userId}
        isAuthenticated={isAuthenticated}
        emptyState={
        <Empty className="rounded-[1.65rem] border-border/32 bg-card/24 px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
          <EmptyHeader>
            <EmptyTitle>No saved reviews</EmptyTitle>
          </EmptyHeader>
        </Empty>
        }
      />
    </section>
  );
}

function SavedReviewsSectionFallback() {
  return (
    <section className="space-y-4 border-t border-border/34 pt-8 [contain-intrinsic-size:720px] [content-visibility:auto] md:border-border/30">
      <div className="flex items-end justify-between border-b border-border/32 pb-4 md:border-border/25">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Saved
        </h2>
      </div>

      <div className="flex justify-center rounded-[1.65rem] border border-border/32 bg-card/24 px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
        <Spinner className="size-4 text-muted-foreground/70" />
      </div>
    </section>
  );
}
