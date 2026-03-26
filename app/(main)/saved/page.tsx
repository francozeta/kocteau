import Link from "next/link";
import { Bookmark, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewCard from "@/components/review-card";
import { getSavedReviewsForUser } from "@/lib/queries/review-bookmarks";
import { getViewerLikedReviewIds } from "@/lib/queries/review-likes";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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
    <section className="space-y-8">
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-muted/60 via-background to-background py-0 shadow-sm">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Bookmark className="size-3.5" />
            Private library
          </div>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Saved reviews
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Keep the sharpest reviews close. This space is private to you and built for
              revisiting ideas, tracks, and perspectives that deserve another listen.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {profile?.username ? (
              <Link
                href={`/u/${profile.username}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-border/40")}
              >
                Back to profile
              </Link>
            ) : null}
            <Link href="/search" className={cn(buttonVariants({ size: "sm" }))}>
              Find more reviews
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-end justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Your saved stack</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved reviews are private and only visible to you.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {savedReviews.length} {savedReviews.length === 1 ? "saved review" : "saved reviews"}
        </p>
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
        <Card>
          <CardHeader>
            <CardTitle>No saved reviews yet</CardTitle>
            <CardDescription>
              Save reviews from the feed, track pages, or profiles and they will collect here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              Go to the feed
              <ChevronRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
