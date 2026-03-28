import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrefetchLink from "@/components/prefetch-link";
import ReviewCommentsPanel from "@/components/review-comments-panel";
import ReviewCard from "@/components/review-card";
import { buttonVariants } from "@/components/ui/button";
import { createPageMetadata, createTrackDescription } from "@/lib/metadata";
import { getReviewPageBundle, getPublicReviewById } from "@/lib/queries/reviews";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bundle = await getReviewPageBundle(id, user?.id);

  if (!bundle) {
    notFound();
  }

  const entity = getEntity(bundle.review);
  const author = getAuthor(bundle.review);
  const isOwner = Boolean(user?.id && author?.id === user.id);

  return (
    <section className="mx-auto max-w-3xl space-y-6 sm:space-y-7">
      <div className="border-b border-border/30 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {entity ? (
            <PrefetchLink
              href={`/track/${entity.id}`}
              className="font-medium text-foreground transition-colors hover:text-foreground/80 hover:underline"
            >
              {entity.title}
            </PrefetchLink>
          ) : null}
          {entity?.artist_name ? (
            <span className="truncate">{entity.artist_name}</span>
          ) : null}
          {author ? (
            <>
              <span className="text-muted-foreground/40">•</span>
              <PrefetchLink
                href={`/u/${author.username}`}
                className="font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                @{author.username}
              </PrefetchLink>
            </>
          ) : null}
        </div>
      </div>

      <ReviewCard
        review={{
          ...bundle.review,
          viewer_has_liked: bundle.liked,
          viewer_has_bookmarked: bundle.bookmarked,
        }}
        entity={entity}
        author={author}
        showAuthor={true}
        entityMode="full"
        featured={true}
        isAuthenticated={Boolean(user)}
        canManage={isOwner}
      />

      <section className="space-y-4 rounded-[1.75rem] border border-border/18 bg-card/12 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">Comments</h2>
            <p className="text-xs text-muted-foreground">
              Join the conversation around this review.
            </p>
          </div>

          {isOwner ? (
            <Link
              href={`/review/${bundle.review.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/30")}
            >
              Edit review
            </Link>
          ) : null}
        </div>

        <ReviewCommentsPanel
          reviewId={bundle.review.id}
          initialCount={bundle.review.comments_count}
          isAuthenticated={Boolean(user)}
          variant="inline"
        />
      </section>
    </section>
  );
}
