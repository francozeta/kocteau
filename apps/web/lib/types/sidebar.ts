export type SidebarOwnedReview = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  is_pinned?: boolean;
  entity: {
    provider: "deezer";
    provider_id: string;
    type: "track";
    title: string;
    artist_name: string | null;
    cover_url: string | null;
    deezer_url: string | null;
    entity_id: string;
  };
};
