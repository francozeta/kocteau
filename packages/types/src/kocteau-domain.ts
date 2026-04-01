export type KocteauEntity = {
  id: string;
  title: string;
  artistName: string | null;
  coverUrl: string | null;
};

export type KocteauAuthor = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
};

export type KocteauReview = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  likesCount: number;
  commentsCount: number;
  bookmarksCount?: number;
  createdAt: string;
  isPinned?: boolean;
  viewerHasLiked?: boolean;
  viewerHasBookmarked?: boolean;
};

export type KocteauReviewCardModel = {
  review: KocteauReview;
  entity: KocteauEntity;
  author: KocteauAuthor;
};

export type KocteauDiscoveryTrack = {
  entity: KocteauEntity;
  reviewCount: number;
  averageRating: number | null;
  latestReviewAt: string;
};

export type KocteauProfileSummary = KocteauAuthor & {
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
};
