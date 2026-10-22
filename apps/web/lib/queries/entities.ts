import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getOrCreateLoader } from "@/lib/queries/cache-loader";
import { normalizeRelation } from "@/lib/queries/normalize-relation";
import { supabasePublic } from "@/lib/supabase/public";
import { supabaseServer } from "@/lib/supabase/server";
import {
  decodeEntityReviewCursor,
  ENTITY_REVIEW_PAGE_SIZE,
  getEntityReviewPage,
} from "@/lib/reviews/entity-pagination";
import { buildReviewHydrationSelect } from "@/lib/queries/review-hydration";
import { getViewerReviewCollectionState } from "@/lib/queries/viewer";
import { measureServerTask } from "@/lib/perf";
import { isFullUuid, isShortUuidPrefix } from "@/lib/seo-routes";
import type {
  ReviewCardAuthor,
  ReviewCardData,
} from "@/components/reviews/review-card";

export type EntityPage = {
  id: string;
  provider: string;
  provider_id: string;
  title: string;
  artist_name: string | null;
  artist_id: string | null;
  parent_album_id: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  release_date: string | null;
  record_type: string | null;
  disambiguation: string | null;
  musicbrainz_recording_id: string | null;
  musicbrainz_release_group_id: string | null;
  first_release_date: string | null;
  genres: string[];
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
  tags: EntityTasteTag[];
  reviews: EntityReview[];
  reviewSummary: EntityReviewSummary;
  nextReviewCursor: string | null;
};

export type EntityReviewSummary = {
  reviewCount: number;
  averageRating: number | null;
};

type EntityReviewsPage = {
  reviews: EntityReview[];
  nextCursor: string | null;
};

type ViewerEntityReview = Pick<EntityReview, "id" | "title" | "body" | "rating" | "is_pinned">;

function getHydratedAuthorId(author: EntityReview["author"]) {
  return author?.id ?? null;
}

const entityPageLoaders = new Map<string, () => Promise<EntityPage | null>>();
const entityPageByProviderLoaders = new Map<string, () => Promise<EntityPage | null>>();
const entityByProviderLoaders = new Map<string, () => Promise<ExistingEntity | null>>();
const entityReviewLoaders = new Map<string, () => Promise<EntityReviewsPage>>();
const entityReviewSummaryLoaders = new Map<string, () => Promise<EntityReviewSummary>>();
const entityTasteTagLoaders = new Map<string, () => Promise<EntityTasteTag[]>>();

const entityPageSelect = "id, provider, provider_id, title, artist_name, artist_id, parent_album_id, cover_url, deezer_url, release_date, record_type, disambiguation, musicbrainz_recording_id, musicbrainz_release_group_id, first_release_date, genres, type";
const entityLookupRevalidateSeconds = 15 * 60;

function logEntitiesQueryError(
  scope:
    | "getEntityPageById"
    | "getEntityPageByRouteId"
    | "getEntityPageByProvider"
    | "findEntityByProvider",
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
  const loader = getOrCreateLoader(
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
                .select(entityPageSelect)
                .eq("id", entityId)
                .maybeSingle<EntityPage>();

              if (error) {
                throw error;
              }

              return data;
            },
            { entityId },
          ),
        ["entity-page", entityId],
        {
          revalidate: entityLookupRevalidateSeconds,
          tags: ["entities", `entity:${entityId}`],
        },
      ),
  );

  try {
    return await loader();
  } catch (error) {
    logEntitiesQueryError(
      "getEntityPageById",
      error as { code?: string; message?: string; details?: string; hint?: string },
      { entityId },
    );
    return null;
  }
}

export const getEntityPageByRouteId = cache(async function getEntityPageByRouteId(
  routeId: string,
) {
  if (isFullUuid(routeId)) {
    return getEntityPageById(routeId);
  }

  if (!isShortUuidPrefix(routeId)) {
    return null;
  }

  const normalizedRouteId = routeId.toLowerCase();

  return measureServerTask(
    "getEntityPageByRouteId",
    async () => {
      const supabase = supabasePublic();
      let query = supabase
        .from("entities")
        .select(entityPageSelect)
        .limit(2);

      query =
        normalizedRouteId.length === 8
          ? query.like("short_id", `${normalizedRouteId}%`)
          : query.eq("short_id", normalizedRouteId);

      const { data, error } = await query.returns<EntityPage[]>();

      if (error) {
        logEntitiesQueryError("getEntityPageByRouteId", error, {
          routeId: normalizedRouteId,
        });
        return null;
      }

      if ((data?.length ?? 0) !== 1) {
        if ((data?.length ?? 0) > 1) {
          console.warn("[entities.getEntityPageByRouteId] ambiguous route id", {
            routeId: normalizedRouteId,
          });
        }

        return null;
      }

      return data?.[0] ?? null;
    },
    { routeId: normalizedRouteId },
  );
});

export async function getEntityPageByProvider(
  provider: string,
  type: EntityPage["type"],
  providerId: string,
) {
  const loader = getOrCreateLoader(
    entityPageByProviderLoaders,
    ["entity-page-by-provider", provider, type, providerId],
    () =>
      unstable_cache(
        async () =>
          measureServerTask(
            "getEntityPageByProvider",
            async () => {
              const supabase = supabasePublic();

              const { data, error } = await supabase
                .from("entities")
                .select(entityPageSelect)
                .eq("provider", provider)
                .eq("type", type)
                .eq("provider_id", providerId)
                .maybeSingle<EntityPage>();

              if (error) {
                throw error;
              }

              return data;
            },
            { provider, type, providerId },
          ),
        ["entity-page-by-provider", provider, type, providerId],
        {
          revalidate: entityLookupRevalidateSeconds,
          tags: ["entities", `entity-provider:${provider}:${type}:${providerId}`],
        },
      ),
  );

  try {
    return await loader();
  } catch (error) {
    logEntitiesQueryError(
      "getEntityPageByProvider",
      error as { code?: string; message?: string; details?: string; hint?: string },
      { provider, type, providerId },
    );
    return null;
  }
}

export async function findEntityByProvider(
  provider: string,
  type: EntityPage["type"],
  providerId: string,
) {
  const loader = getOrCreateLoader(
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
                throw error;
              }

              return data;
            },
            { provider, type, providerId },
          ),
        ["entity-by-provider", provider, type, providerId],
        {
          revalidate: entityLookupRevalidateSeconds,
          tags: ["entities", `entity-provider:${provider}:${type}:${providerId}`],
        },
      ),
  );

  try {
    return await loader();
  } catch (error) {
    logEntitiesQueryError(
      "findEntityByProvider",
      error as { code?: string; message?: string; details?: string; hint?: string },
      { provider, type, providerId },
    );
    return null;
  }
}

export async function getEntityReviewsPage(entityId: string, after: string | null = null) {
  const cursor = decodeEntityReviewCursor(after);
  if (after && !cursor) throw new Error("Invalid review cursor");

  return getOrCreateLoader(
    entityReviewLoaders,
    ["entity-reviews-page", entityId, after],
    () =>
      unstable_cache(
        async () => {
          const supabase = supabasePublic();
          let query = supabase
            .from("reviews")
            .select(buildReviewHydrationSelect("all", { includeAuthor: true, includePinned: true }))
            .eq("entity_id", entityId)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(ENTITY_REVIEW_PAGE_SIZE + 1);
          if (cursor) {
            query = query.lte("created_at", cursor.created_at).or(
              `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
            );
          }
          const { data, error } = await query.returns<EntityReview[]>();
          if (error) throw error;
          const reviews = (data ?? []).map((review) => ({
            ...review,
            author: normalizeRelation(review.author),
            is_pinned: Boolean(review.is_pinned),
          }));
          return getEntityReviewPage(reviews);
        },
        ["entity-reviews-page", entityId, after ?? "first"],
        {
          revalidate: 60,
          tags: ["reviews", `entity:${entityId}:reviews`],
        },
      ),
  )();
}

export const getEntityReviewSummary = cache(async function getEntityReviewSummary(entityId: string): Promise<EntityReviewSummary> {
  return getOrCreateLoader(
    entityReviewSummaryLoaders,
    ["entity-review-summary", entityId],
    () => unstable_cache(
      async () => {
        const { data, error } = await supabasePublic().rpc("get_entity_review_summary", {
          p_entity_id: entityId,
        }).single();
        if (error) throw error;
        return {
          reviewCount: data.review_count,
          averageRating: data.average_rating,
        };
      },
      ["entity-review-summary", entityId],
      { revalidate: 60, tags: ["reviews", `entity:${entityId}:reviews`] },
    ),
  )();
});

export async function getEntityTasteTags(entityId: string) {
  const loader = getOrCreateLoader(
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

              if (error) throw error;

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
  );
  try {
    return await loader();
  } catch {
    console.warn("[entities.getEntityTasteTags] lookup unavailable");
    return [];
  }
}

export const getTrackPublicBundle = cache(async function getTrackPublicBundle(
  entityOrId: EntityPage | string,
  reviewsAfter: string | null = null,
) {
  const entityId = typeof entityOrId === "string" ? entityOrId : entityOrId.id;
  const [entity, page, tags, reviewSummary] = await measureServerTask(
    "getTrackPublicBundle",
    async () =>
      Promise.all([
        typeof entityOrId === "string" ? getEntityPageById(entityId) : entityOrId,
        getEntityReviewsPage(entityId, reviewsAfter),
        getEntityTasteTags(entityId),
        getEntityReviewSummary(entityId),
      ]),
    { entityId },
  );

  if (!entity) {
    return null;
  }

  return {
    entity,
    tags,
    reviews: page.reviews,
    nextReviewCursor: page.nextCursor,
    reviewSummary,
  } satisfies TrackPagePublicBundle;
});

async function getViewerEntityReview(viewerId: string, entityId: string): Promise<ViewerEntityReview | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("reviews")
    .select("id, title, body, rating, is_pinned")
    .eq("entity_id", entityId)
    .eq("author_id", viewerId)
    .maybeSingle<ViewerEntityReview>();
  if (error) throw error;
  return data;
}

export async function getTrackViewerState(
  viewerId: string | null | undefined,
  entityId: string,
  reviews: EntityReview[],
) {
  if (!viewerId) {
    return {
      likedReviewIds: new Set<string>(),
      bookmarkedReviewIds: new Set<string>(),
      viewerReviewId: null as string | null,
      viewerReview: null as ViewerEntityReview | null,
    };
  }

  const visibleReview = reviews.find((review) => getHydratedAuthorId(review.author) === viewerId);
  const [collectionState, viewerReview] = await measureServerTask(
    "getTrackViewerState",
    () => Promise.all([
      getViewerReviewCollectionState(viewerId, reviews.map((review) => review.id)),
      visibleReview ? Promise.resolve(visibleReview) : getViewerEntityReview(viewerId, entityId),
    ]),
    { viewerId, entityId, reviewCount: reviews.length },
  );

  return {
    ...collectionState,
    viewerReviewId: viewerReview?.id ?? null,
    viewerReview,
  };
}
