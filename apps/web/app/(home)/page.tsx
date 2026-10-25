import { Suspense } from "react";
import { circular, redaction } from "@/app/landing-fonts";
import GuestHeader from "@/components/landing/guest-header";
import GuestHome, {
  GuestRecentReviews,
  ProductFeatureGrid,
} from "@/components/landing/guest-home";
import GuestProductPreview from "@/components/landing/guest-product-preview";
import { FeedReviewStackSkeleton } from "@/components/feed/feed-loading-skeletons";
import type { StarterTrack } from "@/lib/starter";
import type { FeedBundleReview } from "@/queries/feed";
import JsonLd from "@/components/shared/json-ld";
import { createPageMetadata } from "@/lib/metadata";
import { measureServerTask } from "@/lib/perf";
import { getFeedPage } from "@/lib/queries/feed";
import { getPublicStarterTracks } from "@/lib/queries/starter";
import {
  buildFeedPageJsonLd,
  buildHomePageJsonLd,
} from "@/lib/structured-data";

export const revalidate = 300;

export const metadata = createPageMetadata({
  title: "Music reviews from real listeners",
  description:
    "Keep a record of what music leaves behind. Read track reviews, save listening notes, and discover music through people whose taste you trust.",
  path: "/",
});

async function HomeProductPreview({
  tracks,
}: {
  tracks: Promise<StarterTrack[]>;
}) {
  return <GuestProductPreview starterTracks={await tracks} />;
}

async function HomeProductFeatures({
  tracks,
}: {
  tracks: Promise<StarterTrack[]>;
}) {
  return <ProductFeatureGrid starterTracks={await tracks} />;
}

async function HomeRecentReviews({
  data,
}: {
  data: Promise<FeedBundleReview[]>;
}) {
  const reviews = await data;
  const feedStructuredData = buildFeedPageJsonLd(
    reviews.flatMap((review) => {
      const entity = review.entities;
      const author = review.author;

      if (!entity?.id || !author?.username) {
        return [];
      }

      return [
        {
          reviewId: review.id,
          reviewTitle: review.title,
          reviewBody: review.body,
          rating: review.rating,
          entity: {
            id: entity.id,
            provider: entity.provider,
            providerId: entity.provider_id,
            type: entity.type,
            title: entity.title,
            artistName: entity.artist_name,
            coverUrl: entity.cover_url,
          },
          author: {
            username: author.username,
            displayName: author.display_name,
          },
        },
      ];
    }),
  );
  return (
    <>
      <JsonLd data={feedStructuredData} id="home-structured-data" />
      <GuestRecentReviews reviews={reviews} />
    </>
  );
}

export default function HomePage() {
  const recentReviews = measureServerTask(
    "getPublicHomeReviews",
    () =>
      getFeedPage({
        view: "latest",
        limit: 3,
        includeActiveUsers: false,
        publicOnly: true,
        revalidateSeconds: 5 * 60,
      }),
    { route: "/" },
  ).then((bundle) => bundle.feed);
  const starterTracks = measureServerTask(
    "getPublicHomeStarters",
    () => getPublicStarterTracks({ limit: 6, contextKey: "home" }),
    { route: "/" },
  );
  return (
    <div
      className={`${circular.variable} ${redaction.variable} kocteau-guest-typography kocteau-guest-grain min-h-svh overflow-x-clip bg-[var(--kocteau-landing-canvas)] text-foreground`}
    >
      <GuestHeader />
      <main className="pt-15 sm:pt-16">
        <JsonLd data={buildHomePageJsonLd()} id="home-page-structured-data" />
        <GuestHome
          recentReviews={
            <Suspense
              fallback={
                <div className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-10">
                  <FeedReviewStackSkeleton />
                </div>
              }
            >
              <HomeRecentReviews data={recentReviews} />
            </Suspense>
          }
          productPreview={
            <Suspense fallback={<GuestProductPreview starterTracks={[]} />}>
              <HomeProductPreview tracks={starterTracks} />
            </Suspense>
          }
          productFeatures={
            <Suspense fallback={<ProductFeatureGrid starterTracks={[]} />}>
              <HomeProductFeatures tracks={starterTracks} />
            </Suspense>
          }
        />
      </main>
    </div>
  );
}
