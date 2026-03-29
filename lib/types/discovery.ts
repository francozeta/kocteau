export type DiscoveryTrack = {
  entityId: string;
  title: string;
  artistName: string | null;
  coverUrl: string | null;
  latestReviewAt: string;
  reviewCount: number;
  averageRating: number | null;
};
