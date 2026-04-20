import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Music2 } from "lucide-react";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import TrackPageHeaderBridge from "@/components/track-page-header-bridge";
import TrackPageHero from "@/components/track-page-hero";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { TrackReviewCard } from "@/components/review-route-cards-server";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata, createTrackDescription } from "@/lib/metadata";
import {
  getEntityPageById,
  getTrackPublicBundle,
  getTrackViewerState,
} from "@/lib/queries/entities";
import { createServerQueryClient } from "@/lib/react-query/server";
import { buildTrackPageJsonLd } from "@/lib/structured-data";
import { trackKeys } from "@/queries/tracks";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entity = await getEntityPageById(id);

  if (!entity) {
    return createPageMetadata({
      title: "Track",
      description: "Track reviews and notes on Kocteau.",
      path: `/track/${id}`,
    });
  }

  const title = entity.artist_name ? `${entity.title} — ${entity.artist_name}` : entity.title;

  return createPageMetadata({
    title,
    description: createTrackDescription(entity.title, entity.artist_name),
    path: `/track/${id}`,
    image: `/api/og/track/${id}`,
  });
}

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editReview?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const userPromise = getCurrentUser();
  const publicBundlePromise = getTrackPublicBundle(id);
  const [user, bundle] = await Promise.all([userPromise, publicBundlePromise]);

  if (!bundle) notFound();

  const viewerState =
    user?.id && bundle.reviews.length > 0
      ? await getTrackViewerState(user.id, id, bundle.reviews)
      : {
          likedReviewIds: new Set<string>(),
          bookmarkedReviewIds: new Set<string>(),
          viewerReviewId: null as string | null,
        };

  const queryClient = createServerQueryClient();
  const trackData = {
    entity: bundle.entity,
    links: bundle.links,
    tags: bundle.tags,
    viewerReviewId: viewerState.viewerReviewId,
    reviews: bundle.reviews.map((review) => ({
      ...review,
      viewer_has_liked: viewerState.likedReviewIds.has(review.id),
      viewer_has_bookmarked: viewerState.bookmarkedReviewIds.has(review.id),
    })),
  };

  queryClient.setQueryData(trackKeys.detail(id), trackData);

  const { entity, reviews: trackReviews } = trackData;
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
        })}
        id="track-structured-data"
      />
      <section className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
        <TrackPageHeaderBridge
          entityId={entity.id}
          title={entity.title}
          artistName={entity.artist_name}
          deezerUrl={entity.deezer_url}
          links={trackData.links}
        />

        <TrackPageHero
          entity={entity}
          links={trackData.links}
          tags={trackData.tags}
          isAuthenticated={Boolean(user)}
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
          shouldOpenViewerEditor={shouldOpenViewerEditor}
        />

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
                    isAuthenticated={Boolean(user)}
                    canManage={Boolean(user?.id && author?.id === user.id)}
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
