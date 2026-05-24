import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import ProfilePageHeader from "@/components/profile-page-header";
import ProfileRecentReviewsSection from "@/components/profile-recent-reviews-section";
import type { ReviewCardAuthor } from "@/components/review-card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ProfileReviewCard } from "@/components/review-route-cards-server";
import { getCurrentUser } from "@/lib/auth/server";
import { getV0ReferralUrl } from "@/lib/creator-perks";
import { createPageMetadata, createProfileDescription } from "@/lib/metadata";
import { getPublicCreatorPerk } from "@/lib/queries/creator-perks";
import {
  getProfilePublicBundle,
  getProfileViewerState,
  getPublicProfileByUsername,
  type ProfileReview,
} from "@/lib/queries/profiles";
import { getViewerFollowsProfile } from "@/lib/queries/profile-follows";
import { buildProfilePageJsonLd } from "@/lib/structured-data";

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
    image: `/api/og/profile/${profile.username}`,
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
  const creatorPerkPromise = getPublicCreatorPerk(profile.id);
  const [{ likedReviewIds, bookmarkedReviewIds }, isFollowing, creatorPerk] = await Promise.all([
    viewerStatePromise,
    followingPromise,
    creatorPerkPromise,
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
  const profileAuthor: ReviewCardAuthor = {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <JsonLd
        data={buildProfilePageJsonLd({
          profile,
          reviewCount: totalReviews,
        })}
        id="profile-structured-data"
      />
      <ProfilePageHeader
        profile={{
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          spotify_url: profile.spotify_url,
          apple_music_url: profile.apple_music_url,
          deezer_url: profile.deezer_url,
          is_official: profile.is_official,
          official_label: profile.official_label,
        }}
        totalReviews={totalReviews}
        memberSince={memberSince}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isAuthenticated={Boolean(user)}
        creatorPerk={
          creatorPerk
            ? {
                unlockedAt: creatorPerk.unlocked_at,
                v0ReferralUrl: isOwnProfile ? getV0ReferralUrl() : null,
              }
            : null
        }
      />

      <div className="space-y-5">
        {hydratedPinnedReview ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground/92">
                Pinned
              </h2>
            </div>
            <ProfileReviewCard
              review={{
                ...hydratedPinnedReview,
              }}
              entity={hydratedPinnedReview.entities}
              author={profileAuthor}
              featured
              isAuthenticated={Boolean(user)}
              canManage={isOwnProfile}
            />
          </section>
        ) : null}

        {hydratedReviews.length > 0 ? (
          <section className="space-y-4">
            <ProfileRecentReviewsSection reviews={hydratedReviews} />

            <div className="space-y-4 pt-2">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
                  Reviews
                </h2>
              </div>
              <div className="space-y-4">
                {hydratedReviews.map((review) => (
                  <ProfileReviewCard
                    key={review.id}
                    review={{
                      ...review,
                    }}
                    entity={review.entities}
                    author={profileAuthor}
                    isAuthenticated={Boolean(user)}
                    canManage={isOwnProfile}
                  />
                ))}
              </div>
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
      </div>
    </div>
  );
}
