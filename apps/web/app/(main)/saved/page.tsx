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
    <section className="mx-auto w-full max-w-[42rem] space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.35rem]">
            Saved
          </h1>
          <p className="text-sm text-muted-foreground">
            {savedReviews.length} {savedReviews.length === 1 ? "saved review" : "saved reviews"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Suspense fallback={null}>
            <SavedProfileAction userId={user.id} />
          </Suspense>
          <Link
            href="/search"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full border-border/24 bg-card/18 hover:border-border/40 hover:bg-card/26",
            )}
          >
            Explore
          </Link>
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
            <EmptyDescription>Save a review to keep it here.</EmptyDescription>
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
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "rounded-full bg-card/12 hover:bg-card/22",
      )}
    >
      Profile
    </PrefetchLink>
  );
}
