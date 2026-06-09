import type { FeedReview } from "@/lib/queries/feed";
import type { EntityPage } from "@/lib/queries/entities";
import type { PublicProfile } from "@/lib/queries/profiles";
import type { ReviewPageReview } from "@/lib/queries/reviews";
import { getMetadataBase } from "@/lib/metadata";
import { buildEntityCanonicalPath, buildReviewCanonicalPath } from "@/lib/seo-routes";

type FeedStructuredDataEntry = {
  reviewId: FeedReview["id"];
  reviewTitle: FeedReview["title"];
  reviewBody: FeedReview["body"];
  rating: FeedReview["rating"];
  entity: {
    id: string;
    provider?: string | null;
    providerId?: string | null;
    type?: string | null;
    title: string;
    artistName?: string | null;
    coverUrl?: string | null;
  };
  author: {
    username: string;
    displayName?: string | null;
  };
};

type StructuredReviewEntry = {
  id: string;
  title?: string | null;
  body?: string | null;
  rating: number;
  created_at?: string | null;
  entity: {
    id: string;
    provider?: string | null;
    providerId?: string | null;
    type?: string | null;
    title: string;
    artistName?: string | null;
    coverUrl?: string | null;
    deezerUrl?: string | null;
  };
  author: {
    username: string;
    displayName?: string | null;
  };
};

function absoluteUrl(path: string) {
  return new URL(path, getMetadataBase()).toString();
}

function authorName(author: StructuredReviewEntry["author"]) {
  return author.displayName?.trim() || `@${author.username}`;
}

function buildReviewNode(entry: StructuredReviewEntry) {
  const entityPath = buildEntityCanonicalPath({
    id: entry.entity.id,
    provider: entry.entity.provider,
    provider_id: entry.entity.providerId,
    type: entry.entity.type,
    title: entry.entity.title,
    artist_name: entry.entity.artistName,
  });
  const reviewPath = buildReviewCanonicalPath({
    id: entry.id,
    entities: {
      id: entry.entity.id,
      provider: entry.entity.provider,
      provider_id: entry.entity.providerId,
      type: entry.entity.type,
      title: entry.entity.title,
      artist_name: entry.entity.artistName,
    },
  });

  return {
    "@type": "Review",
    "@id": `${absoluteUrl(reviewPath)}#review`,
    url: absoluteUrl(reviewPath),
    name: entry.title?.trim() || `${entry.entity.title} review`,
    reviewBody: entry.body?.trim() || undefined,
    datePublished: entry.created_at || undefined,
    reviewRating: {
      "@type": "Rating",
      ratingValue: entry.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person",
      name: authorName(entry.author),
      url: absoluteUrl(`/u/${entry.author.username}`),
    },
    itemReviewed: {
      "@type": "MusicRecording",
      "@id": `${absoluteUrl(entityPath)}#recording`,
      name: entry.entity.title,
      url: absoluteUrl(entityPath),
      image: entry.entity.coverUrl || undefined,
      sameAs: entry.entity.deezerUrl || undefined,
      byArtist: entry.entity.artistName
        ? {
            "@type": "MusicGroup",
            name: entry.entity.artistName,
          }
        : undefined,
    },
  };
}

function buildBreadcrumbList(items: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildSiteGraphJsonLd() {
  const siteUrl = absoluteUrl("/");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: "Kocteau",
        alternateName: ["Kocteau music reviews", "Kocteau reviews"],
        url: siteUrl,
        logo: absoluteUrl("/logo.svg"),
        description:
          "Kocteau is a music review and discovery app for ratings, listening notes, saved reviews, and public taste profiles.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        name: "Kocteau",
        alternateName: ["Kocteau reviews", "Kocteau music reviews"],
        url: siteUrl,
        description:
          "Read music reviews, track listening notes, discover active songs, and explore public taste profiles on Kocteau.",
        publisher: {
          "@id": `${siteUrl}#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function buildFeedPageJsonLd(entries: FeedStructuredDataEntry[]) {
  const siteUrl = absoluteUrl("/");

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}#feed`,
    name: "Recent music reviews and listening notes",
    description:
      "Read recent music reviews, ratings, and listening notes, discover active tracks, and explore public profiles on Kocteau.",
    url: siteUrl,
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(buildReviewCanonicalPath({
          id: entry.reviewId,
          entities: {
            id: entry.entity.id,
            provider: entry.entity.provider,
            provider_id: entry.entity.providerId,
            type: entry.entity.type,
            title: entry.entity.title,
            artist_name: entry.entity.artistName,
          },
        })),
        item: buildReviewNode({
          id: entry.reviewId,
          title: entry.reviewTitle,
          body: entry.reviewBody,
          rating: entry.rating,
          entity: entry.entity,
          author: entry.author,
        }),
      })),
    },
  };
}

export function buildReviewsPageJsonLd(entries: FeedStructuredDataEntry[]) {
  const url = absoluteUrl("/reviews");

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#reviews`,
    name: "Music reviews on Kocteau",
    description:
      "Recent public music reviews, ratings, and listening notes from Kocteau.",
    url,
    isPartOf: {
      "@id": `${absoluteUrl("/")}#website`,
    },
    breadcrumb: buildBreadcrumbList([
      { name: "Kocteau", path: "/" },
      { name: "Reviews", path: "/reviews" },
    ]),
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(buildReviewCanonicalPath({
          id: entry.reviewId,
          entities: {
            id: entry.entity.id,
            provider: entry.entity.provider,
            provider_id: entry.entity.providerId,
            type: entry.entity.type,
            title: entry.entity.title,
            artist_name: entry.entity.artistName,
          },
        })),
        item: buildReviewNode({
          id: entry.reviewId,
          title: entry.reviewTitle,
          body: entry.reviewBody,
          rating: entry.rating,
          entity: entry.entity,
          author: entry.author,
        }),
      })),
    },
  };
}

export function buildTrackPageJsonLd({
  entity,
  reviewCount,
  averageRating,
  reviews = [],
}: {
  entity: EntityPage;
  reviewCount: number;
  averageRating?: number | null;
  reviews?: Array<{
    id: string;
    title?: string | null;
    body?: string | null;
    rating: number;
    created_at?: string | null;
    author?: {
      username: string;
      display_name?: string | null;
    } | null;
  }>;
}) {
  const entityPath = buildEntityCanonicalPath(entity);
  const url = absoluteUrl(entityPath);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: entity.artist_name ? `${entity.title} by ${entity.artist_name}` : entity.title,
        isPartOf: {
          "@id": `${absoluteUrl("/")}#website`,
        },
        mainEntity: {
          "@id": `${url}#recording`,
        },
        breadcrumb: buildBreadcrumbList([
          { name: "Kocteau", path: "/" },
          { name: "Tracks", path: "/track" },
          { name: entity.title, path: entityPath },
        ]),
      },
      {
        "@type": "MusicRecording",
        "@id": `${url}#recording`,
        name: entity.title,
        url,
        image: entity.cover_url || undefined,
        sameAs: entity.deezer_url || undefined,
        byArtist: entity.artist_name
          ? {
              "@type": "MusicGroup",
              name: entity.artist_name,
            }
          : undefined,
        aggregateRating:
          reviewCount > 0 && typeof averageRating === "number"
            ? {
                "@type": "AggregateRating",
                ratingValue: Number(averageRating.toFixed(1)),
                reviewCount,
                bestRating: 5,
                worstRating: 1,
              }
            : undefined,
        review: reviews
          .filter((review) => review.author?.username)
          .map((review) =>
            buildReviewNode({
              id: review.id,
              title: review.title,
              body: review.body,
              rating: review.rating,
              created_at: review.created_at,
              entity: {
                id: entity.id,
                provider: entity.provider,
                providerId: entity.provider_id,
                type: entity.type,
                title: entity.title,
                artistName: entity.artist_name,
                coverUrl: entity.cover_url,
                deezerUrl: entity.deezer_url,
              },
              author: {
                username: review.author?.username ?? "",
                displayName: review.author?.display_name,
              },
            }),
          ),
      },
    ],
  };
}

export function buildReviewPageJsonLd(review: ReviewPageReview) {
  const entity = review.entities;
  const author = review.author;
  const url = absoluteUrl(buildReviewCanonicalPath(review));

  if (!entity || !author?.username) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: review.title?.trim() || "Kocteau review",
      isPartOf: {
        "@id": `${absoluteUrl("/")}#website`,
      },
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: review.title?.trim() || `${entity.title} review`,
        isPartOf: {
          "@id": `${absoluteUrl("/")}#website`,
        },
        mainEntity: {
          "@id": `${url}#review`,
        },
        breadcrumb: buildBreadcrumbList([
          { name: "Kocteau", path: "/" },
          { name: "Reviews", path: "/reviews" },
          { name: entity.title, path: buildEntityCanonicalPath(entity) },
        ]),
      },
      buildReviewNode({
        id: review.id,
        title: review.title,
        body: review.body,
        rating: review.rating,
        created_at: review.created_at,
        entity: {
          id: entity.id,
          title: entity.title,
          artistName: entity.artist_name,
          coverUrl: entity.cover_url,
          deezerUrl: entity.deezer_url,
        },
        author: {
          username: author.username,
          displayName: author.display_name,
        },
      }),
    ],
  };
}

export function buildProfilePageJsonLd({
  profile,
  reviewCount,
}: {
  profile: PublicProfile;
  reviewCount: number;
}) {
  const url = absoluteUrl(`/u/${profile.username}`);
  const sameAs = [
    profile.spotify_url,
    profile.apple_music_url,
    profile.deezer_url,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profile`,
        url,
        name: profile.display_name
          ? `${profile.display_name} (@${profile.username})`
          : `@${profile.username}`,
        isPartOf: {
          "@id": `${absoluteUrl("/")}#website`,
        },
        mainEntity: {
          "@id": `${url}#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name: profile.display_name?.trim() || `@${profile.username}`,
        alternateName: `@${profile.username}`,
        url,
        image: profile.avatar_url || undefined,
        description: profile.bio?.trim() || undefined,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
        interactionStatistic:
          reviewCount > 0
            ? {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/WriteAction",
                userInteractionCount: reviewCount,
              }
            : undefined,
      },
    ],
  };
}
