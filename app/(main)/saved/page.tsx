import Link from "next/link";
import { Bookmark, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import ReviewCard from "@/components/review-card";
import { createPageMetadata } from "@/lib/metadata";
import { getSavedReviewsForUser } from "@/lib/queries/review-bookmarks";
import { getViewerLikedReviewIds } from "@/lib/queries/review-likes";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "Saved",
  description: "Private library of saved reviews on Kocteau.",
  path: "/saved",
  noIndex: true,
});

export default async function SavedReviewsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, savedReviews] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle(),
    getSavedReviewsForUser(supabase, user.id),
  ]);

  const savedReviewIds = savedReviews
    .map((savedReview) => savedReview.review?.id)
    .filter((reviewId): reviewId is string => Boolean(reviewId));
  const likedReviewIds = await getViewerLikedReviewIds(supabase, user.id, savedReviewIds);

  return (
    <section className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <div className="border-b border-border/30 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <Bookmark className="size-3.5" />
              Saved
            </div>
            <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.2rem]">
              Saved reviews
            </h1>
            <p className="text-sm text-muted-foreground">
              {savedReviews.length} {savedReviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {profile?.username ? (
              <Link
                href={`/u/${profile.username}`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
              >
                Profile
              </Link>
            ) : null}
            <Link href="/search" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/30")}>
              Search
            </Link>
          </div>
        </div>
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
                  viewer_has_liked: likedReviewIds.has(savedReview.review.id),
                  viewer_has_bookmarked: true,
                }}
                entity={reviewEntity}
                author={reviewAuthor}
                showAuthor={true}
                entityMode="inline"
                eyebrow="Saved for later"
                isAuthenticated={true}
                bookmarkRefreshOnToggle={true}
              />
            );
          })}
        </div>
      ) : (
        <Empty className="rounded-[1.75rem] border-border/25 bg-card/20 px-6 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bookmark className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No saved reviews yet</EmptyTitle>
            <EmptyDescription>
              Save a review and it will appear here.
            </EmptyDescription>
          </EmptyHeader>
          <CardContent className="p-0 pt-2">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              Go to the feed
              <ChevronRight className="size-4" />
            </Link>
          </CardContent>
        </Empty>
      )}
    </section>
  );
}
