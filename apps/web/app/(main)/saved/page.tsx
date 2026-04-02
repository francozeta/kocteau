import Link from "next/link";
import { Suspense } from "react";
import { Bookmark, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import PrefetchLink from "@/components/prefetch-link";
import SavedReviewsList from "@/components/saved-reviews-list";
import { buttonVariants } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getCurrentUser, getCurrentViewerProfile } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getViewerSavedReviewsBundle } from "@/lib/queries/viewer";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "Saved",
  description: "Private library of saved reviews on Kocteau.",
  path: "/saved",
  noIndex: true,
});

export default async function SavedReviewsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { reviews: savedReviews } = await getViewerSavedReviewsBundle(user.id);

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
            <Suspense fallback={null}>
              <SavedProfileAction userId={user.id} />
            </Suspense>
            <Link href="/search" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/30")}>
              Explore
            </Link>
          </div>
        </div>
      </div>

      <SavedReviewsList
        initialReviews={savedReviews}
        userId={user.id}
        isAuthenticated
        emptyState={
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
            <PrefetchLink
              href="/"
              queryWarmup={{ kind: "feed" }}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
            >
              Go to the feed
              <ChevronRight className="size-4" />
            </PrefetchLink>
          </CardContent>
        </Empty>
        }
      />
    </section>
  );
}

async function SavedProfileAction({ userId }: { userId: string }) {
  const profile = await getCurrentViewerProfile();

  if (!profile?.username || profile.id !== userId) {
    return null;
  }

  return (
    <PrefetchLink
      href={`/u/${profile.username}`}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
    >
      Profile
    </PrefetchLink>
  );
}
