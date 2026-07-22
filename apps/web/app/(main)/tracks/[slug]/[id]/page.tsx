import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Music2 } from "@/components/ui/icons";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "@/components/json-ld";
import TrackPageHeaderBridge from "@/components/track-page-header-bridge";
import TrackPageHero from "@/components/track-page-hero";
import TrackMoreToHear from "@/components/track-more-to-hear";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { TrackReviewCard } from "@/components/review-route-cards-server";
import { getCurrentUserId } from "@/lib/auth/server";
import { createPageMetadata, createTrackDescription } from "@/lib/metadata";
import {
  getEntityPageByRouteId,
  getTrackPublicBundle,
  getTrackViewerState,
} from "@/lib/queries/entities";
import {
  getEntityLibraryStateOrEmpty,
  getViewerEntityLibraryState,
} from "@/lib/queries/entity-library";
import { getTrackRecommendations } from "@/lib/queries/track-recommendations";
import { createServerQueryClient } from "@/lib/react-query/server";
import { buildEntityCanonicalPath, isSeoRouteId } from "@/lib/seo-routes";
import { buildTrackPageJsonLd } from "@/lib/structured-data";
import { trackKeys } from "@/queries/tracks";

type TrackRouteParams = {
  slug: string;
  id: string;
};

function getRoutePath({ slug, id }: TrackRouteParams) {
  return `/tracks/${slug}/${id}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<TrackRouteParams>;
}): Promise<Metadata> {
  const routeParams = await params;

  if (!isSeoRouteId(routeParams.id)) {
    return createPageMetadata({
      title: "Track",
      description: "Track reviews and notes on Kocteau.",
      path: getRoutePath(routeParams),
      noIndex: true,
    });
  }

  const entity = await getEntityPageByRouteId(routeParams.id);

  if (!entity) {
    return createPageMetadata({
      title: "Track",
      description: "Track reviews and notes on Kocteau.",
      path: getRoutePath(routeParams),
      noIndex: true,
    });
  }

  const title = entity.artist_name ? `${entity.title} — ${entity.artist_name}` : entity.title;
  const canonicalPath = buildEntityCanonicalPath(entity);

  return createPageMetadata({
    title,
    description: createTrackDescription(entity.title, entity.artist_name),
    path: canonicalPath,
    image: `/api/og/track/${entity.id}`,
  });
}

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<TrackRouteParams>;
  searchParams: Promise<{ editReview?: string }>;
}) {
  const routeParams = await params;
  const query = await searchParams;

  if (!isSeoRouteId(routeParams.id)) {
    notFound();
  }

  const entityPage = await getEntityPageByRouteId(routeParams.id);

  if (!entityPage) {
    notFound();
  }

  const canonicalPath = buildEntityCanonicalPath(entityPage);

  if (canonicalPath !== getRoutePath(routeParams)) {
    permanentRedirect(canonicalPath);
  }

  const userIdPromise = getCurrentUserId();
  const publicBundlePromise = getTrackPublicBundle(entityPage.id);
  const [userId, bundle] = await Promise.all([userIdPromise, publicBundlePromise]);

  if (!bundle) notFound();

  const emptyViewerState = {
    likedReviewIds: new Set<string>(),
    bookmarkedReviewIds: new Set<string>(),
    viewerReviewId: null as string | null,
  };
  const [viewerState, libraryStates] = await Promise.all([
    userId && bundle.reviews.length > 0
      ? getTrackViewerState(userId, entityPage.id, bundle.reviews)
      : Promise.resolve(emptyViewerState),
    userId
      ? getViewerEntityLibraryState(userId, [entityPage.id])
      : Promise.resolve(new Map()),
  ]);
  const initialLibraryState = getEntityLibraryStateOrEmpty(
    libraryStates,
    entityPage.id,
  );

  const queryClient = createServerQueryClient();
  const trackData = {
    entity: bundle.entity,
    tags: bundle.tags,
    viewerReviewId: viewerState.viewerReviewId,
    reviews: bundle.reviews.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
  };

  queryClient.setQueryData(trackKeys.detail(entityPage.id), trackData);

  const { entity, reviews: trackReviews } = trackData;
  const recommendations = await getTrackRecommendations({
    currentEntityId: entity.id,
    currentProviderId: entity.provider_id,
    title: entity.title,
    artistName: entity.artist_name,
    tags: trackData.tags,
    limit: 18,
  });
  const { viewerReviewId } = trackData;
  const viewerReview =
    viewerReviewId
      ? trackReviews.find((review) => review.id === viewerReviewId) ?? null
      : null;
  const shouldOpenViewerEditor = Boolean(
    viewerReview &&
      query.editReview &&
      query.editReview === viewerReview.id,
  );
  const averageRating =
    trackReviews.length > 0
      ? trackReviews.reduce((sum, review) => sum + review.rating, 0) / trackReviews.length
      : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd
        data={buildTrackPageJsonLd({
          entity,
          reviewCount: trackReviews.length,
          averageRating,
          reviews: trackReviews.slice(0, 12).map((review) => ({
            id: review.id,
            title: review.title,
            body: review.body,
            rating: review.rating,
            created_at: review.created_at,
            author: review.author
              ? {
                  username: review.author.username,
                  display_name: review.author.display_name,
                }
              : null,
          })),
        })}
        id="track-structured-data"
      />
      <section className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
        <TrackPageHeaderBridge
          entityId={entity.id}
          provider={entity.provider}
          providerId={entity.provider_id}
          type={entity.type}
          isAuthenticated={Boolean(userId)}
          title={entity.title}
          artistName={entity.artist_name}
          deezerUrl={entity.deezer_url}
          sharePath={canonicalPath}
        />

        <TrackPageHero
          entity={entity}
          isAuthenticated={Boolean(userId)}
          initialLibraryState={initialLibraryState}
          viewerReview={
            viewerReview
              ? {
                  id: viewerReview.id,
                  title: viewerReview.title ?? "",
                  body: viewerReview.body ?? "",
                  rating: viewerReview.rating,
                  is_pinned: Boolean(viewerReview.is_pinned),
                }
              : null
          }
          sharePath={canonicalPath}
          shouldOpenViewerEditor={shouldOpenViewerEditor}
        />

        <TrackMoreToHear groups={recommendations} />

        <div className="space-y-4">
          {trackReviews.length > 0 ? (
            <div className="space-y-4">
              {trackReviews.map((review) => {
                const author = review.author;

                return (
                  <TrackReviewCard
                    key={review.id}
                    review={review}
                    entity={entity}
                    author={author}
                    isAuthenticated={Boolean(userId)}
                    canManage={Boolean(userId && author?.id === userId)}
                  />
                );
              })}
            </div>
          ) : (
            <Empty className="rounded-[1.45rem] border-border/28 bg-card/20 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Music2 className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No notes yet</EmptyTitle>
                <EmptyDescription>This track is still waiting for the first review.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </section>
    </HydrationBoundary>
  );
}
