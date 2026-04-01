import type {
  KocteauDiscoveryTrack,
  KocteauEntity,
  KocteauProfileSummary,
  KocteauReviewCardModel,
} from "@kocteau/types";

const authors: KocteauProfileSummary[] = [
  {
    id: "author-sofia",
    username: "sofialuna",
    displayName: "Sofia Luna",
    avatarUrl: null,
    bio: "Cataloging late-night listens, underrated pop, and albums that get better on the fourth spin.",
    reviewsCount: 18,
    followersCount: 284,
    followingCount: 119,
  },
  {
    id: "author-mauro",
    username: "maurofm",
    displayName: "Mauro FM",
    avatarUrl: null,
    bio: "Rhythm-first reviews, long walks, and a weakness for immaculate sequencing.",
    reviewsCount: 27,
    followersCount: 412,
    followingCount: 98,
  },
  {
    id: "author-jules",
    username: "julesafterdark",
    displayName: "Jules After Dark",
    avatarUrl: null,
    bio: "Club records, ambient detours, and notes from the commute home.",
    reviewsCount: 14,
    followersCount: 167,
    followingCount: 75,
  },
];

const entities: KocteauEntity[] = [
  {
    id: "track-brat",
    title: "BRAT",
    artistName: "Charli xcx",
    coverUrl: null,
  },
  {
    id: "track-blonde",
    title: "Blonde",
    artistName: "Frank Ocean",
    coverUrl: null,
  },
  {
    id: "track-immunity",
    title: "Immunity",
    artistName: "Clairo",
    coverUrl: null,
  },
  {
    id: "track-raven",
    title: "Raven",
    artistName: "Kelela",
    coverUrl: null,
  },
];

export const mockReviewCards: KocteauReviewCardModel[] = [
  {
    review: {
      id: "review-brat-sofia",
      title: "Messy, sharp, and impossible to ignore",
      body: "The hook density is absurd, but what really lands is how confident the sequencing feels. Every left turn still belongs to the same world.",
      rating: 4.7,
      likesCount: 84,
      commentsCount: 16,
      bookmarksCount: 21,
      createdAt: "2026-03-28T22:18:00.000Z",
      viewerHasLiked: true,
      viewerHasBookmarked: false,
    },
    entity: entities[0],
    author: authors[0],
  },
  {
    review: {
      id: "review-blonde-mauro",
      title: "Still sounds like memory folding in on itself",
      body: "I came back for the atmosphere and stayed for how surgical the writing is. It never shouts, but it keeps finding new places to hurt.",
      rating: 4.9,
      likesCount: 112,
      commentsCount: 24,
      bookmarksCount: 32,
      createdAt: "2026-03-27T18:42:00.000Z",
      isPinned: true,
      viewerHasLiked: false,
      viewerHasBookmarked: true,
    },
    entity: entities[1],
    author: authors[1],
  },
  {
    review: {
      id: "review-immunity-jules",
      title: "A small room, but every detail matters",
      body: "This one feels hand-written in the best way. The guitar textures are soft, but the emotional framing is precise all the way through.",
      rating: 4.4,
      likesCount: 61,
      commentsCount: 9,
      bookmarksCount: 15,
      createdAt: "2026-03-26T09:11:00.000Z",
      viewerHasLiked: false,
      viewerHasBookmarked: false,
    },
    entity: entities[2],
    author: authors[2],
  },
  {
    review: {
      id: "review-raven-sofia",
      title: "Weightless production with a steel core",
      body: "The percussion barely touches the floor, but the vocal framing gives everything tension. It feels luxurious without becoming vague.",
      rating: 4.6,
      likesCount: 47,
      commentsCount: 7,
      bookmarksCount: 12,
      createdAt: "2026-03-25T14:55:00.000Z",
      viewerHasLiked: true,
      viewerHasBookmarked: true,
    },
    entity: entities[3],
    author: authors[0],
  },
];

export const mockDiscoveryTracks: KocteauDiscoveryTrack[] = entities.map((entity) => {
  const reviews = mockReviewCards.filter((entry) => entry.entity.id === entity.id);
  const averageRating = reviews.length
    ? reviews.reduce((total, entry) => total + entry.review.rating, 0) / reviews.length
    : null;

  return {
    entity,
    reviewCount: reviews.length,
    averageRating,
    latestReviewAt: reviews[0]?.review.createdAt ?? new Date().toISOString(),
  };
});

export const mockViewerProfile = authors[0];

export function getReviewById(reviewId: string) {
  return mockReviewCards.find((entry) => entry.review.id === reviewId) ?? null;
}

export function getEntityById(entityId: string) {
  return entities.find((entity) => entity.id === entityId) ?? null;
}

export function getReviewsForEntity(entityId: string) {
  return mockReviewCards.filter((entry) => entry.entity.id === entityId);
}

export function getProfileByUsername(username: string) {
  return authors.find((author) => author.username === username) ?? null;
}

export function getReviewsByUsername(username: string) {
  return mockReviewCards.filter((entry) => entry.author.username === username);
}
