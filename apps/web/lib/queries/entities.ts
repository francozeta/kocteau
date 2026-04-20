import "server-only";

import { unstable_cache } from "next/cache";
import { getOrCreateLoader } from "@/lib/queries/cache-loader";
import { normalizeRelation } from "@/lib/queries/normalize-relation";
import { runReviewListQuery } from "@/lib/queries/review-likes";
import { supabasePublic } from "@/lib/supabase/public";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { getViewerReviewCollectionState } from "@/lib/queries/viewer";
import { measureServerTask } from "@/lib/perf";
import type {
  ReviewCardAuthor,
  ReviewCardData,
} from "@/components/review-card";

export type EntityPage = {
  id: string;
  provider: string;
  provider_id: string;
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  type: "track" | "album";
};

export type EntityTasteTag = {
  id: string;
  kind: "genre" | "mood" | "scene" | "style" | "era" | "format";
  slug: string;
  label: string;
  source: string;
  weight: number;
};

export type EntityExternalLink = {
  platform: string;
  label: string;
  url: string;
  sort_order: number;
};

export type ExistingEntity = {
  id: string;
};

export type EntityReview = {
  id: ReviewCardData["id"];
  title: ReviewCardData["title"];
  body: ReviewCardData["body"];
  rating: ReviewCardData["rating"];
  likes_count: ReviewCardData["likes_count"];
  comments_count: ReviewCardData["comments_count"];
  created_at: ReviewCardData["created_at"];
  is_pinned: boolean;
  author: ReviewCardAuthor | null;
};

export type TrackPagePublicBundle = {
  entity: EntityPage;
  links: EntityExternalLink[];
  tags: EntityTasteTag[];
  reviews: EntityReview[];
};

function getHydratedAuthorId(author: EntityReview["author"]) {
  return author?.id ?? null;
}

const entityPageLoaders = new Map<string, () => Promise<EntityPage | null>>();
const entityByProviderLoaders = new Map<string, () => Promise<ExistingEntity | null>>();
const entityReviewLoaders = new Map<string, () => Promise<EntityReview[]>>();
const entityTasteTagLoaders = new Map<string, () => Promise<EntityTasteTag[]>>();
const entityExternalLinkLoaders = new Map<string, () => Promise<EntityExternalLink[]>>();

function logEntitiesQueryError(
  scope: "getEntityPageById" | "findEntityByProvider",
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  },
  context: Record<string, unknown>,
) {
  console.error(`[entities.${scope}] failed`, {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    context,
  });
}

export async function getEntityPageById(entityId: string) {
  return getOrCreateLoader(
    entityPageLoaders,
    ["entity-page", entityId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getEntityPageById",
            async () => {
              const supabase = supabasePublic();

              const { data, error } = await supabase
                .from("entities")
                .select("id, provider, provider_id, title, artist_name, cover_url, deezer_url, type")
                .eq("id", entityId)
                .maybeSingle<EntityPage>();

              if (error) {
                logEntitiesQueryError("getEntityPageById", error, {
                  entityId,
                });
                return null;
              }

              return data;
            },
            { entityId },
          ),
        ["entity-page", entityId],
        {
          revalidate: 120,
          tags: ["entities", `entity:${entityId}`],
        },
      ),
  )();
}

export async function findEntityByProvider(
  provider: string,
  type: EntityPage["type"],
  providerId: string,
) {
  return getOrCreateLoader(
    entityByProviderLoaders,
    ["entity-by-provider", provider, type, providerId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "findEntityByProvider",
            async () => {
              const supabase = supabasePublic();

              const { data, error } = await supabase
                .from("entities")
                .select("id")
                .eq("provider", provider)
                .eq("type", type)
                .eq("provider_id", providerId)
                .maybeSingle<ExistingEntity>();

              if (error) {
                logEntitiesQueryError("findEntityByProvider", error, {
                  provider,
                  type,
                  providerId,
                });
                return null;
              }

              return data;
            },
            { provider, type, providerId },
          ),
        ["entity-by-provider", provider, type, providerId],
        {
          revalidate: 120,
          tags: ["entities", `entity-provider:${provider}:${type}:${providerId}`],
        },
      ),
  )();
}

export async function getReviewsForEntity(entityId: string) {
  return getOrCreateLoader(
    entityReviewLoaders,
    ["entity-reviews", entityId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getReviewsForEntity",
            async () => {
              const supabase = supabasePublic();

              const reviews = await runReviewListQuery<EntityReview>(async (mode) =>
                supabase
                  .from("reviews")
                  .select(
                    buildReviewHydrationSelect(mode, {
                      includeAuthor: true,
                      includePinned: true,
                    }),
                  )
                  .eq("entity_id", entityId)
                  .order("created_at", { ascending: false }),
              );

              return reviews.map((review) => ({
                ...review,
                author: normalizeRelation(review.author),
                is_pinned: Boolean(review.is_pinned),
              }));
            },
            { entityId },
          ),
        ["entity-reviews", entityId],
        {
          revalidate: 60,
          tags: ["reviews", `entity:${entityId}:reviews`],
        },
      ),
  )();
}

function getPlatformLabel(platform: string) {
  switch (platform) {
    case "apple_music":
      return "Apple Music";
    case "youtube_music":
      return "YouTube Music";
    default:
      return platform
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function mergeEntityLinks(
  entity: EntityPage,
  externalLinks: EntityExternalLink[],
) {
  const links: EntityExternalLink[] = [];
  const seen = new Set<string>();

  if (entity.deezer_url) {
    links.push({
      platform: "deezer",
      label: "Deezer",
      url: entity.deezer_url,
      sort_order: 0,
    });
    seen.add("deezer");
  }

  for (const link of externalLinks) {
    if (seen.has(link.platform)) {
      continue;
    }

    links.push({
      ...link,
      label: link.label || getPlatformLabel(link.platform),
    });
    seen.add(link.platform);
  }

  return links.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

export async function getEntityTasteTags(entityId: string) {
  return getOrCreateLoader(
    entityTasteTagLoaders,
    ["entity-taste-tags", entityId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getEntityTasteTags",
            async () => {
              const supabase = supabasePublic();

              type EntityPreferenceTagRow = {
                source: string;
                weight: number;
                preference_tags: {
                  id: string;
                  kind: EntityTasteTag["kind"];
                  slug: string;
                  label: string;
                } | null;
              };

              const { data, error } = await supabase
                .from("entity_preference_tags")
                .select(
                  `
                    source,
                    weight,
                    preference_tags (
                      id,
                      kind,
                      slug,
                      label
                    )
                  `,
                )
                .eq("entity_id", entityId)
                .order("weight", { ascending: false })
                .returns<EntityPreferenceTagRow[]>();

              if (error) {
                console.error("[entities.getEntityTasteTags] failed", {
                  code: error.code ?? null,
                  message: error.message ?? null,
                  entityId,
                });
                return [];
              }

              return (data ?? []).flatMap((row) =>
                row.preference_tags
                  ? [
                      {
                        id: row.preference_tags.id,
                        kind: row.preference_tags.kind,
                        slug: row.preference_tags.slug,
                        label: row.preference_tags.label,
                        source: row.source,
                        weight: row.weight,
                      },
                    ]
                  : [],
              );
            },
            { entityId },
          ),
        ["entity-taste-tags", entityId],
        {
          revalidate: 120,
          tags: ["entities", `entity:${entityId}`, `entity:${entityId}:taste-tags`],
        },
      ),
  )();
}

export async function getEntityExternalLinks(entityId: string) {
  return getOrCreateLoader(
    entityExternalLinkLoaders,
    ["entity-external-links", entityId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getEntityExternalLinks",
            async () => {
              const supabase = supabasePublic();
              type EntityExternalLinkRow = Omit<EntityExternalLink, "label"> & {
                label: string | null;
              };

              const { data, error } = await supabase
                .from("entity_external_links")
                .select("platform, label, url, sort_order")
                .eq("entity_id", entityId)
                .order("sort_order", { ascending: true })
                .returns<EntityExternalLinkRow[]>();

              if (error) {
                if (error.code === "42P01") {
                  return [];
                }

                console.error("[entities.getEntityExternalLinks] failed", {
                  code: error.code ?? null,
                  message: error.message ?? null,
                  entityId,
                });
                return [];
              }

              return (data ?? []).map((link) => ({
                ...link,
                label: link.label || getPlatformLabel(link.platform),
              }));
            },
            { entityId },
          ),
        ["entity-external-links", entityId],
        {
          revalidate: 300,
          tags: ["entities", `entity:${entityId}`, `entity:${entityId}:links`],
        },
      ),
  )();
}

export async function getTrackPublicBundle(entityId: string) {
  const [entity, reviews, tags, externalLinks] = await measureServerTask(
    "getTrackPublicBundle",
    async () =>
      Promise.all([
        getEntityPageById(entityId),
        getReviewsForEntity(entityId),
        getEntityTasteTags(entityId),
        getEntityExternalLinks(entityId),
      ]),
    { entityId },
  );

  if (!entity) {
    return null;
  }

  return {
    entity,
    links: mergeEntityLinks(entity, externalLinks),
    tags,
    reviews,
  } satisfies TrackPagePublicBundle;
}

export async function getTrackViewerState(
  viewerId: string | null | undefined,
  entityId: string,
  reviews: EntityReview[],
) {
  if (!viewerId || reviews.length === 0) {
    return {
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
      viewerReviewId: null as string | null,
    };
  }

  const reviewIds = reviews.map((review) => review.id);
  const viewerReviewId =
    reviews.find((review) => getHydratedAuthorId(review.author) === viewerId)?.id ?? null;

  const { likedReviewIds, bookmarkedReviewIds } = await measureServerTask(
    "getTrackViewerState",
    async () => getViewerReviewCollectionState(viewerId, reviewIds),
    { viewerId, entityId, reviewCount: reviewIds.length },
  );

  return {
    likedReviewIds,
    bookmarkedReviewIds,
    viewerReviewId,
  };
}

export async function getTrackPageBundle(
  entityId: string,
  viewerId?: string | null,
) {
  const publicBundle = await getTrackPublicBundle(entityId);

  if (!publicBundle) {
    return null;
  }

  if (!viewerId || publicBundle.reviews.length === 0) {
    return {
      entity: publicBundle.entity,
      reviews: publicBundle.reviews,
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
      viewerReviewId: null as string | null,
    };
  }

  const { likedReviewIds, bookmarkedReviewIds, viewerReviewId } = await getTrackViewerState(
    viewerId,
    entityId,
    publicBundle.reviews,
  );

  return {
    entity: publicBundle.entity,
    reviews: publicBundle.reviews,
    likedReviewIds,
    bookmarkedReviewIds,
    viewerReviewId,
  };
}
