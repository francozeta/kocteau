export type DiscoveryTrack = {
  entityId: string;
  provider: string;
  providerId: string;
  type: "track" | "album";
  title: string;
  artistName: string | null;
  coverUrl: string | null;
  latestReviewAt: string;
  reviewCount: number;
  averageRating: number | null;
};
