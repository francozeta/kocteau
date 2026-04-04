import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import Link from "next/link";
import { MessageSquarePlus, Music2, Star } from "lucide-react";
import { notFound } from "next/navigation";
import EditReviewDialog from "@/components/edit-review-dialog";
import EntityCoverImage from "@/components/entity-cover-image";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { TrackReviewCard } from "@/components/review-route-cards-server";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata, createTrackDescription } from "@/lib/metadata";
import {
  getEntityPageById,
  getTrackPublicBundle,
  getTrackViewerState,
  type EntityReview,
} from "@/lib/queries/entities";
import { createServerQueryClient } from "@/lib/react-query/server";
import { cn } from "@/lib/utils";
import { trackKeys } from "@/queries/tracks";

function getAuthor(review: EntityReview) {
  if (Array.isArray(review.author)) {
    return review.author[0] ?? null;
  }

  return review.author;
}

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
  const composeParams = new URLSearchParams({
    compose: "1",
    reviewQuery: [entity.title, entity.artist_name].filter(Boolean).join(" "),
    composeProvider: entity.provider,
    composeProviderId: entity.provider_id,
    composeTitle: entity.title,
  });

  if (entity.artist_name) {
    composeParams.set("composeArtist", entity.artist_name);
  }

  if (entity.cover_url) {
    composeParams.set("composeCover", entity.cover_url);
  }

  if (entity.deezer_url) {
    composeParams.set("composeDeezer", entity.deezer_url);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section className="mx-auto max-w-4xl space-y-5 sm:space-y-7">
        <div className="grid gap-4 border-b border-border/32 pb-6 md:border-border/24 lg:grid-cols-[8.5rem,minmax(0,1fr)] lg:items-start">
          <EntityCoverImage
            src={entity.cover_url}
            alt={entity.title}
            sizes="(max-width: 640px) 112px, 128px"
            priority
            quality={75}
            className="h-28 w-28 rounded-[1.5rem] border border-border/28 bg-muted/26 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:h-32 sm:w-32 md:border-border/18 md:bg-muted/20"
            iconClassName="size-10"
          />

          <div className="min-w-0 space-y-4">
            <div className="space-y-2.5">
              <div className="space-y-2">
                <h1 className="font-serif text-3xl font-bold leading-none tracking-tight text-balance sm:text-[3.05rem]">
                  {entity.title}
                </h1>
                <p className="text-[15px] font-medium text-muted-foreground sm:text-base">
                  {entity.artist_name ?? "Unknown artist"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-card/24 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] md:border-border/18 md:bg-card/12">
                <span className="text-sm font-medium text-foreground">{trackReviews.length}</span>
                <span className="text-xs text-muted-foreground">
                  {trackReviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-card/24 px-3 py-1.5 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] md:border-border/18 md:bg-card/12">
                <Star className="size-3.5 fill-current text-amber-400" />
                <span className="text-sm font-medium">
                  {averageRating ? averageRating.toFixed(1) : "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {viewerReview ? (
                <EditReviewDialog
                  reviewId={viewerReview.id}
                  defaultOpen={shouldOpenViewerEditor}
                  dismissSearchParam="editReview"
                  triggerLabel="Edit review"
                  triggerVariant="default"
                  triggerSize="default"
                  showDefaultTriggerIcon
                  triggerClassName="gap-2 rounded-full border-transparent bg-foreground px-3.5 text-background shadow-none hover:bg-foreground/90"
                  initialSelection={{
                    provider: "deezer",
                    provider_id: entity.provider_id,
                    type: "track",
                    title: entity.title,
                    artist_name: entity.artist_name,
                    cover_url: entity.cover_url,
                    deezer_url: entity.deezer_url,
                    entity_id: entity.id,
                  }}
                  initialTitle={viewerReview.title ?? ""}
                  initialBody={viewerReview.body ?? ""}
                  initialRating={viewerReview.rating}
                  initialPinned={Boolean(viewerReview.is_pinned)}
                />
              ) : (
                <Link
                  href={`/track/${entity.id}?${composeParams.toString()}`}
                  className={cn(buttonVariants({ size: "default" }), "gap-2 rounded-full bg-foreground px-3.5 text-background hover:bg-foreground/90")}
                >
                  <MessageSquarePlus className="size-4" />
                  Write review
                </Link>
              )}

              {entity.deezer_url ? (
                <a
                  href={entity.deezer_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "default" }), "rounded-full border-border/34 bg-card/14 px-3.5 md:border-border/25 md:bg-transparent")}
                >
                  Deezer
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="max-w-3xl space-y-3.5">
          <div className="border-b border-border/32 pb-4 md:border-border/25">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Reviews
            </h2>
          </div>

          {trackReviews.length > 0 ? (
            <div className="space-y-4">
              {trackReviews.map((review) => {
                const author = getAuthor(review);

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
            <Empty className="rounded-[1.65rem] border-border/32 bg-card/24 px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Music2 className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No reviews yet</EmptyTitle>
                <EmptyDescription>Be the first to review it.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </section>
    </HydrationBoundary>
  );
}
