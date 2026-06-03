"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import FeedReviewCta from "@/components/feed-review-cta";
import FeedStarterLayer from "@/components/feed-starter-layer";
import FeedStarterShelf from "@/components/feed-starter-shelf";
import { Music2, Sparkles, UsersRound } from "@/components/ui/icons";
import { FeedReviewCard } from "@/components/review-route-cards";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { FeedView } from "@/lib/feed-view";
import type { StarterTrack } from "@/lib/starter";
import {
  feedInfiniteQueryOptions,
  type FeedBundleQueryData,
  type FeedBundleReview,
} from "@/queries/feed";

type FeedReviewListViewer = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
} | null;

type FeedReviewListProps = {
  view: FeedView;
  initialPage: FeedBundleQueryData;
  isAuthenticated: boolean;
  viewer: FeedReviewListViewer;
  starterTracks?: StarterTrack[];
};

const recommendationReasonLabels = {
  entity_taste: "In your lane",
  taste_match: "Taste match",
  following: "From your follows",
  familiar_entity: "Related pick",
  author_affinity: "Similar listener",
  popular_recent: "Popular now",
} satisfies Partial<Record<
  NonNullable<FeedBundleReview["recommendation_reason"]>,
  string
>>;

function getRecommendationEyebrow(review: FeedBundleReview, view: FeedView) {
  if (view !== "for-you" || !review.recommendation_reason) {
    return null;
  }

  if (review.recommendation_reason === "own_review") {
    return null;
  }

  return recommendationReasonLabels[review.recommendation_reason] ?? null;
}

function FeedEmptyState({
  view,
  isAuthenticated,
}: {
  view: FeedView;
  isAuthenticated: boolean;
}) {
  if (view === "for-you") {
    return (
      <Empty className="rounded-lg border-border/42 bg-card/40 px-6 py-10 md:border-border/34 md:bg-card/32">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles className="size-4" />
          </EmptyMedia>
          <EmptyTitle>{isAuthenticated ? "No picks yet" : "Log in to tune For You"}</EmptyTitle>
          <EmptyDescription>
            {isAuthenticated
              ? "Review, save, or follow a few listeners to warm up your feed."
              : "Your tuned feed starts from taste signals and listening activity."}
          </EmptyDescription>
        </EmptyHeader>
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Log in
          </Link>
        ) : null}
      </Empty>
    );
  }

  if (view === "following") {
    return (
      <Empty className="rounded-lg border-border/42 bg-card/40 px-6 py-10 md:border-border/34 md:bg-card/32">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersRound className="size-4" />
          </EmptyMedia>
          <EmptyTitle>{isAuthenticated ? "No following reviews yet" : "Log in to see Following"}</EmptyTitle>
          <EmptyDescription>
            {isAuthenticated
              ? "Follow more listeners and their reviews will show up here."
              : "Your following feed is built from people you follow."}
          </EmptyDescription>
        </EmptyHeader>
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Log in
          </Link>
        ) : null}
      </Empty>
    );
  }

  return (
    <Empty className="rounded-lg border-border/42 bg-card/40 px-6 py-10 md:border-border/34 md:bg-card/32">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Music2 className="size-4" />
        </EmptyMedia>
        <EmptyTitle>No reviews yet</EmptyTitle>
        <EmptyDescription>Start with a review.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function FeedReviewList({
  view,
  initialPage,
  isAuthenticated,
  viewer,
  starterTracks = [],
}: FeedReviewListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const trackedPageKeysRef = useRef(new Set<string>());
  const feedQuery = useInfiniteQuery({
    ...feedInfiniteQueryOptions(view),
    initialData: {
      pages: [initialPage],
      pageParams: [null],
    },
  });
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = feedQuery;
  const reviews = useMemo(() => {
    const seen = new Set<string>();

    return (data?.pages ?? []).flatMap((page) =>
      page.feed.filter((review) => {
        if (seen.has(review.id)) {
          return false;
        }

        seen.add(review.id);
        return true;
      }),
    );
  }, [data?.pages]);
  const reviewedStarterKeys = useMemo(() => {
    const keys = new Set<string>();

    reviews.forEach((review) => {
      const entity = review.entities;

      if (!entity?.provider || !entity.provider_id || !entity.type) {
        return;
      }

      keys.add(`${entity.provider}:${entity.type}:${entity.provider_id}`);
    });

    return keys;
  }, [reviews]);
  const visibleStarterTracks = useMemo(
    () =>
      starterTracks.filter(
        (track) =>
          !reviewedStarterKeys.has(
            `${track.provider}:${track.type}:${track.provider_id}`,
          ),
      ),
    [reviewedStarterKeys, starterTracks],
  );

  useEffect(() => {
    if (view !== "for-you" || !isAuthenticated) {
      return;
    }

    let reviewPositionOffset = 0;

    (data?.pages ?? []).forEach((page, pageIndex) => {
      const reviewIds = page.feed.map((review) => review.id);
      const pageStartPosition = reviewPositionOffset;
      reviewPositionOffset += page.feed.length;

      if (reviewIds.length === 0) {
        return;
      }

      const pageKey = `${pageIndex}:${reviewIds.join(",")}`;

      if (trackedPageKeysRef.current.has(pageKey)) {
        return;
      }

      trackedPageKeysRef.current.add(pageKey);
      trackAnalyticsEvent({
        eventType: "feed_loaded",
        source: "feed:for-you",
        metadata: {
          view,
          page_index: pageIndex,
          review_count: reviewIds.length,
          starter_count: visibleStarterTracks.length,
          review_ids: reviewIds,
          has_cursor: Boolean(page.nextCursor),
          has_next_page: Boolean(page.nextCursor),
        },
      });

      page.feed.forEach((review, reviewIndex) => {
        trackAnalyticsEvent({
          eventType: "review_impression",
          source: "feed:for-you",
          metadata: {
            review_id: review.id,
            entity_id: review.entities?.id ?? null,
            reason: review.recommendation_reason ?? null,
            page_index: pageIndex,
            position: pageStartPosition + reviewIndex,
          },
        });
      });
    });
  }, [data?.pages, isAuthenticated, view, visibleStarterTracks.length]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      {
        rootMargin: "360px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const showStarterLayer =
    view === "for-you" &&
    isAuthenticated &&
    visibleStarterTracks.length > 0 &&
    reviews.length < 4;
  const showStarterShelf =
    visibleStarterTracks.length > 0 &&
    reviews.length > 0 &&
    (
      (isAuthenticated && view === "for-you") ||
      (!isAuthenticated && view === "latest")
    );
  const showReviewCta = view === "for-you" || view === "latest";

  if (reviews.length === 0) {
    if (showStarterLayer) {
      return (
        <FeedStarterLayer
          tracks={visibleStarterTracks}
          isAuthenticated={isAuthenticated}
        />
      );
    }

    return <FeedEmptyState view={view} isAuthenticated={isAuthenticated} />;
  }

  return (
    <div className="space-y-3.5">
      {showReviewCta ? (
        <FeedReviewCta isAuthenticated={isAuthenticated} />
      ) : null}

      {showStarterShelf ? (
        <FeedStarterShelf
          tracks={visibleStarterTracks}
          isAuthenticated={isAuthenticated}
          variant={isAuthenticated ? "personalized" : "editorial"}
          className={isAuthenticated ? "lg:hidden" : undefined}
        />
      ) : null}

      {reviews.map((review, index) => {
        const author = review.author;

        return (
          <div key={review.id}>
            <FeedReviewCard
              review={review}
              entity={review.entities}
              author={author}
              showInteractionBar={isAuthenticated}
              isAuthenticated={isAuthenticated}
              canManage={Boolean(viewer?.id && author?.id === viewer.id)}
              recommendationEyebrow={getRecommendationEyebrow(review, view)}
              imagePriority={index === 0}
              analyticsSource={view === "for-you" ? "feed:for-you" : null}
              viewer={viewer}
            />
          </div>
        );
      })}

      {showStarterLayer ? (
        <div className={showStarterShelf ? "hidden lg:block" : undefined}>
          <FeedStarterLayer
            tracks={visibleStarterTracks}
            isAuthenticated={isAuthenticated}
          />
        </div>
      ) : null}

      {hasNextPage ? (
        <div ref={sentinelRef} className="flex min-h-12 items-center justify-center py-2">
          {isFetchingNextPage ? (
            <Spinner className="size-4 text-muted-foreground/70" />
          ) : null}
        </div>
      ) : (
        <p className="py-3 text-center text-xs text-muted-foreground/46">
          created by{" "}
          <Link
            href="https://francozeta.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-muted-foreground/62 underline underline-offset-4 transition-colors hover:text-muted-foreground/82"
          >
            francozeta
          </Link>
        </p>
      )}
    </div>
  );
}
