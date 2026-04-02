import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import Link from "next/link";
import { MessageSquarePlus, Music2, Star } from "lucide-react";
import { notFound } from "next/navigation";
import EditReviewDialog from "@/components/edit-review-dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { TrackReviewCard } from "@/components/review-route-cards";
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
    image: entity.cover_url,
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
      <section className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <div className="grid gap-5 border-b border-border/24 pb-7 lg:grid-cols-[9rem,minmax(0,1fr)] lg:items-start">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[1.6rem] border border-border/14 bg-muted/20 sm:h-36 sm:w-36">
          {entity.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entity.cover_url}
              alt={entity.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Music2 className="size-10 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/18 bg-card/10 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {entity.type}
              </Badge>
              <Badge variant="outline" className="border-border/18 bg-card/10 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {entity.provider === "deezer" ? "Deezer" : entity.provider}
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-balance sm:text-[3.15rem]">
                {entity.title}
              </h1>
              <p className="text-base font-medium text-muted-foreground sm:text-[1.05rem]">
                {entity.artist_name ?? "Unknown artist"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/18 bg-card/12 px-3 py-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Reviews
              </span>
              <span className="text-sm font-medium text-foreground">{trackReviews.length}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border/18 bg-card/12 px-3 py-2 text-foreground">
              <Star className="size-3.5 fill-current text-amber-400" />
              <span className="text-sm font-medium">
                {averageRating ? averageRating.toFixed(1) : "—"}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Average
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {viewerReview ? (
              <EditReviewDialog
                reviewId={viewerReview.id}
                defaultOpen={shouldOpenViewerEditor}
                dismissSearchParam="editReview"
                triggerLabel="Edit review"
                showDefaultTriggerIcon
                triggerClassName="gap-2 rounded-full bg-foreground text-background hover:bg-foreground/90"
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
                className={cn(buttonVariants({ size: "sm" }), "gap-2 rounded-full bg-foreground text-background hover:bg-foreground/90")}
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
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/25")}
              >
                Deezer
              </a>
            ) : null}
          </div>
        </div>
        </div>

        <div className="max-w-3xl space-y-4">
          <div className="flex items-end justify-between border-b border-border/25 pb-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Reviews
            </h2>
            <span className="text-xs text-muted-foreground">Newest first</span>
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
            <Empty className="rounded-[1.65rem] border-border/20 bg-card/18 px-6 py-9">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Music2 className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No reviews yet</EmptyTitle>
                <EmptyDescription>
                  Be the first to leave a note on this track.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </section>
    </HydrationBoundary>
  );
}
