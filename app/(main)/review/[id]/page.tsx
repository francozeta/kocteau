import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ArrowLeft, MessageSquareText, Star } from "lucide-react";
import { notFound } from "next/navigation";
import EditReviewDialog from "@/components/edit-review-dialog";
import PrefetchLink from "@/components/prefetch-link";
import ReviewCommentsPanel from "@/components/review-comments-panel";
import { ReviewPageCard } from "@/components/review-route-cards";
import ReviewFloatingCommentInput from "@/components/review-floating-comment-input";
import ReviewMobileHeader from "@/components/review-mobile-header";
import UserAvatar from "@/components/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata, createTrackDescription } from "@/lib/metadata";
import { getReviewPageBundle, getPublicReviewById } from "@/lib/queries/reviews";
import { createServerQueryClient } from "@/lib/react-query/server";
import { cn } from "@/lib/utils";
import { reviewKeys } from "@/queries/reviews";

function getEntity(
  review: NonNullable<Awaited<ReturnType<typeof getPublicReviewById>>>,
) {
  if (Array.isArray(review.entities)) {
    return review.entities[0] ?? null;
  }

  return review.entities;
}

function getAuthor(
  review: NonNullable<Awaited<ReturnType<typeof getPublicReviewById>>>,
) {
  if (Array.isArray(review.author)) {
    return review.author[0] ?? null;
  }

  return review.author;
}

function buildReviewDescription(
  title: string | null,
  body: string | null,
  entityTitle: string | null,
  artistName: string | null,
) {
  if (body?.trim()) {
    const normalized = body.trim().replace(/\s+/g, " ");
    return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
  }

  if (title?.trim()) {
    return title.trim();
  }

  if (entityTitle) {
    return createTrackDescription(entityTitle, artistName);
  }

  return "Music review on Kocteau.";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const review = await getPublicReviewById(id);

  if (!review) {
    return createPageMetadata({
      title: "Review",
      description: "Music review on Kocteau.",
      path: `/review/${id}`,
    });
  }

  const entity = getEntity(review);
  const author = getAuthor(review);
  const title =
    review.title?.trim() ||
    (entity?.title
      ? `${entity.title}${entity.artist_name ? ` — ${entity.artist_name}` : ""}`
      : "Review");

  return createPageMetadata({
    title,
    description: buildReviewDescription(
      review.title,
      review.body,
      entity?.title ?? null,
      entity?.artist_name ?? null,
    ),
    path: `/review/${id}`,
    image: entity?.cover_url ?? author?.avatar_url ?? null,
  });
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const bundle = await getReviewPageBundle(id, user?.id);

  if (!bundle) {
    notFound();
  }

  const queryClient = createServerQueryClient();
  const reviewData = {
    review: {
      ...bundle.review,
      viewer_has_liked: bundle.liked,
      viewer_has_bookmarked: bundle.bookmarked,
    },
  };

  queryClient.setQueryData(reviewKeys.detail(id), reviewData);

  const entity = getEntity(bundle.review);
  const author = getAuthor(bundle.review);
  const isOwner = Boolean(user?.id && author?.id === user.id);
  const headline =
    bundle.review.title?.trim() ||
    entity?.title ||
    "Untitled review";
  const authorLabel =
    author?.display_name?.trim() || (author?.username ? `@${author.username}` : "Unknown user");
  const replyTarget = author?.username ? `@${author.username}` : authorLabel;
  const commentsLabel = `${bundle.review.comments_count} ${
    bundle.review.comments_count === 1 ? "comment" : "comments"
  }`;
  const fallbackHref = entity ? `/track/${entity.id}` : "/";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReviewMobileHeader
        reviewId={bundle.review.id}
        reviewTitle={bundle.review.title}
        entityTitle={entity?.title ?? null}
        entityId={entity?.id ?? null}
        canManage={isOwner}
        fallbackHref={fallbackHref}
      />
      <ReviewFloatingCommentInput
        reviewId={bundle.review.id}
        initialCount={bundle.review.comments_count}
        isAuthenticated={Boolean(user)}
        replyTarget={replyTarget}
      />

      <section className="mx-auto max-w-3xl space-y-6 pb-24 sm:space-y-8 md:pb-0">
        <div className="space-y-5 border-b border-border/24 pb-5 sm:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="hidden flex-wrap items-center gap-2 text-sm text-muted-foreground md:flex">
            <PrefetchLink
              href={fallbackHref}
              queryWarmup={entity ? { kind: "track", id: entity.id } : { kind: "feed" }}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 rounded-full border border-border/20 bg-card/10 px-3 text-muted-foreground hover:bg-card/18 hover:text-foreground",
              )}
            >
              <ArrowLeft className="size-3.5" />
              {entity ? "Back to track" : "Back to feed"}
            </PrefetchLink>
          </div>

          {isOwner && entity ? (
            <EditReviewDialog
              reviewId={bundle.review.id}
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
              initialTitle={bundle.review.title ?? ""}
              initialBody={bundle.review.body ?? ""}
              initialRating={bundle.review.rating}
              initialPinned={Boolean(bundle.review.is_pinned)}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Review
            </p>
            <h1 className="max-w-3xl font-serif text-[2.1rem] font-semibold tracking-tight text-foreground sm:text-[2.55rem]">
              {headline}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar
                avatarUrl={author?.avatar_url}
                displayName={author?.display_name ?? null}
                username={author?.username ?? null}
                size="sm"
                className="size-7"
                fallbackClassName="text-[10px]"
              />
              {author ? (
                <PrefetchLink
                  href={`/u/${author.username}`}
                  className="font-medium text-foreground transition-colors hover:text-foreground/80"
                >
                  {authorLabel}
                </PrefetchLink>
              ) : (
                <span className="font-medium text-foreground">{authorLabel}</span>
              )}
            </div>
            <span className="text-muted-foreground/45">•</span>
            <span>{formatDate(bundle.review.created_at)}</span>
            {entity?.artist_name ? (
              <>
                <span className="text-muted-foreground/45">•</span>
                <span>{entity.artist_name}</span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {entity ? (
              <PrefetchLink
                href={`/track/${entity.id}`}
                queryWarmup={{ kind: "track", id: entity.id }}
                className="inline-flex max-w-full items-center gap-3 rounded-[1.15rem] border border-border/16 bg-card/10 px-3 py-2 transition-colors hover:bg-card/16"
              >
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.95rem] border border-border/12 bg-muted/22">
                  {entity.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entity.cover_url}
                      alt={entity.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate font-serif text-[15px] font-medium text-foreground">{entity.title}</p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {entity.artist_name ?? "Unknown artist"}
                  </p>
                </div>
              </PrefetchLink>
            ) : null}

            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/16 bg-card/10 px-3 py-2 text-sm text-foreground">
              <Star className="size-3.5 fill-current text-amber-400" />
              {bundle.review.rating.toFixed(1)}
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/16 bg-card/10 px-3 py-2 text-sm text-muted-foreground">
              <MessageSquareText className="size-3.5" />
              {commentsLabel}
            </div>
          </div>
        </div>
        </div>

        <ReviewPageCard
          review={reviewData.review}
          entity={entity}
          author={author}
          isAuthenticated={Boolean(user)}
          canManage={isOwner}
        />

        <section className="overflow-hidden rounded-[1.7rem] border border-border/14 bg-card/10">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/18 px-4 py-4 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Discussion
            </p>

            <p className="text-sm text-muted-foreground">{commentsLabel}</p>
          </div>

          <div className="px-4 py-5 sm:px-5">
            <ReviewCommentsPanel
              reviewId={bundle.review.id}
              initialCount={bundle.review.comments_count}
              isAuthenticated={Boolean(user)}
              variant="inline"
              hideForm
            />
          </div>
        </section>
      </section>
    </HydrationBoundary>
  );
}
