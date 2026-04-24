import type { FeedReview } from "@/lib/queries/feed";
import type { EntityPage } from "@/lib/queries/entities";
import type { PublicProfile } from "@/lib/queries/profiles";
import { getMetadataBase } from "@/lib/metadata";

type FeedStructuredDataEntry = {
  reviewId: FeedReview["id"];
  reviewTitle: FeedReview["title"];
  reviewBody: FeedReview["body"];
  rating: FeedReview["rating"];
  entity: {
    id: string;
    title: string;
    artistName?: string | null;
    coverUrl?: string | null;
  };
  author: {
    username: string;
    displayName?: string | null;
  };
};

function absoluteUrl(path: string) {
  return new URL(path, getMetadataBase()).toString();
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
        url: siteUrl,
        logo: absoluteUrl("/logo.svg"),
        description:
          "Kocteau is a music review and discovery app for ratings, listening notes, saved reviews, and public taste profiles.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        name: "Kocteau",
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
        url: absoluteUrl(`/track/${entry.entity.id}#review-${entry.reviewId}`),
        item: {
          "@type": "Review",
          name: entry.reviewTitle?.trim() || `${entry.entity.title} review`,
          reviewBody: entry.reviewBody?.trim() || undefined,
          reviewRating: {
            "@type": "Rating",
            ratingValue: entry.rating,
            bestRating: 5,
            worstRating: 1,
          },
          author: {
            "@type": "Person",
            name: entry.author.displayName?.trim() || `@${entry.author.username}`,
            url: absoluteUrl(`/u/${entry.author.username}`),
          },
          itemReviewed: {
            "@type": "MusicRecording",
            name: entry.entity.title,
            byArtist: entry.entity.artistName
              ? {
                  "@type": "MusicGroup",
                  name: entry.entity.artistName,
                }
              : undefined,
            url: absoluteUrl(`/track/${entry.entity.id}`),
            image: entry.entity.coverUrl || undefined,
          },
        },
      })),
    },
  };
}

export function buildTrackPageJsonLd({
  entity,
  reviewCount,
  averageRating,
}: {
  entity: EntityPage;
  reviewCount: number;
  averageRating?: number | null;
}) {
  const url = absoluteUrl(`/track/${entity.id}`);

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
      },
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
