import "server-only";

import { cache } from "react";
import type { PreferenceKind, PreferenceTag } from "@/lib/taste";
import { preferenceKindOrder } from "@/lib/taste";
import type { Tables } from "@/lib/supabase/database.types";
import { supabasePublic } from "@/lib/supabase/public";

type StarterTrackRow = Pick<
  Tables<"starter_tracks">,
  | "id"
  | "provider"
  | "provider_id"
  | "type"
  | "title"
  | "artist_name"
  | "cover_url"
  | "deezer_url"
  | "prompt"
  | "editorial_note"
  | "is_featured"
  | "sort_order"
  | "created_at"
>;

type StarterTrackTagRow = Pick<
  Tables<"starter_track_tags">,
  "starter_track_id" | "tag_id" | "weight"
>;

export type AtlasTag = PreferenceTag & {
  starterPickCount: number;
};

export type AtlasStarterPick = StarterTrackRow & {
  tagWeight: number;
};

export type AtlasTagPage = {
  tag: AtlasTag;
  picks: AtlasStarterPick[];
  relatedTags: AtlasTag[];
};

const tagSelect =
  "id, kind, slug, label, description, is_featured, sort_order, created_at";
const starterTrackSelect =
  "id, provider, provider_id, type, title, artist_name, cover_url, deezer_url, prompt, editorial_note, is_featured, sort_order, created_at";

function compareTags(first: Pick<AtlasTag, "kind" | "sort_order" | "label">, second: Pick<AtlasTag, "kind" | "sort_order" | "label">) {
  const firstKind = preferenceKindOrder.indexOf(first.kind);
  const secondKind = preferenceKindOrder.indexOf(second.kind);

  if (firstKind !== secondKind) {
    return firstKind - secondKind;
  }

  if (first.sort_order !== second.sort_order) {
    return first.sort_order - second.sort_order;
  }

  return first.label.localeCompare(second.label);
}

function compareRelatedTags(activeKind: PreferenceKind) {
  return (first: AtlasTag, second: AtlasTag) => {
    const firstSameKind = first.kind === activeKind ? 0 : 1;
    const secondSameKind = second.kind === activeKind ? 0 : 1;

    if (firstSameKind !== secondSameKind) {
      return firstSameKind - secondSameKind;
    }

    if (first.starterPickCount !== second.starterPickCount) {
      return second.starterPickCount - first.starterPickCount;
    }

    if (first.is_featured !== second.is_featured) {
      return first.is_featured ? -1 : 1;
    }

    return compareTags(first, second);
  };
}

export const getAtlasTags = cache(async (): Promise<AtlasTag[]> => {
  const supabase = supabasePublic();
  const [tagsResult, starterTracksResult] = await Promise.all([
    supabase
      .from("preference_tags")
      .select(tagSelect)
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true })
      .returns<PreferenceTag[]>(),
    supabase
      .from("starter_tracks")
      .select("id")
      .eq("is_active", true)
      .returns<Array<Pick<Tables<"starter_tracks">, "id">>>(),
  ]);

  if (tagsResult.error) {
    console.error("[atlas.getAtlasTags] tags query failed", {
      code: tagsResult.error.code ?? null,
      message: tagsResult.error.message ?? null,
    });

    return [];
  }

  if (starterTracksResult.error) {
    console.error("[atlas.getAtlasTags] starter track query failed", {
      code: starterTracksResult.error.code ?? null,
      message: starterTracksResult.error.message ?? null,
    });
  }

  const activeStarterTrackIds = (starterTracksResult.data ?? []).map((track) => track.id);
  const tagCounts = new Map<string, number>();

  if (activeStarterTrackIds.length > 0) {
    const tagLinksResult = await supabase
      .from("starter_track_tags")
      .select("tag_id, starter_track_id")
      .in("starter_track_id", activeStarterTrackIds)
      .returns<Array<Pick<StarterTrackTagRow, "tag_id" | "starter_track_id">>>();

    if (tagLinksResult.error) {
      console.error("[atlas.getAtlasTags] tag link query failed", {
        code: tagLinksResult.error.code ?? null,
        message: tagLinksResult.error.message ?? null,
      });
    }

    for (const row of tagLinksResult.data ?? []) {
      tagCounts.set(row.tag_id, (tagCounts.get(row.tag_id) ?? 0) + 1);
    }
  }

  return (tagsResult.data ?? [])
    .map((tag) => ({
      ...tag,
      starterPickCount: tagCounts.get(tag.id) ?? 0,
    }))
    .sort(compareTags);
});

export const getAtlasTagPage = cache(async (slug: string): Promise<AtlasTagPage | null> => {
  const tags = await getAtlasTags();
  const tag = tags.find((item) => item.slug === slug);

  if (!tag) {
    return null;
  }

  const picks = await getStarterPicksForAtlasTag(tag.id, 12);
  const relatedTags = tags
    .filter((item) => item.id !== tag.id)
    .filter((item) => item.kind === tag.kind || item.starterPickCount > 0)
    .sort(compareRelatedTags(tag.kind))
    .slice(0, 14);

  return {
    tag,
    picks,
    relatedTags,
  };
});

async function getStarterPicksForAtlasTag(
  tagId: string,
  limit: number,
): Promise<AtlasStarterPick[]> {
  const supabase = supabasePublic();
  const requestedLimit = Math.max(1, Math.min(limit, 24));
  const tagLinksResult = await supabase
    .from("starter_track_tags")
    .select("starter_track_id, tag_id, weight")
    .eq("tag_id", tagId)
    .order("weight", { ascending: false })
    .limit(requestedLimit * 3)
    .returns<StarterTrackTagRow[]>();

  if (tagLinksResult.error) {
    console.error("[atlas.getStarterPicksForAtlasTag] tag links query failed", {
      code: tagLinksResult.error.code ?? null,
      message: tagLinksResult.error.message ?? null,
    });

    return [];
  }

  const tagLinks = tagLinksResult.data ?? [];
  const starterTrackIds = tagLinks.map((row) => row.starter_track_id);

  if (starterTrackIds.length === 0) {
    return [];
  }

  const tracksResult = await supabase
    .from("starter_tracks")
    .select(starterTrackSelect)
    .in("id", starterTrackIds)
    .eq("is_active", true)
    .returns<StarterTrackRow[]>();

  if (tracksResult.error) {
    console.error("[atlas.getStarterPicksForAtlasTag] starter tracks query failed", {
      code: tracksResult.error.code ?? null,
      message: tracksResult.error.message ?? null,
    });

    return [];
  }

  const tracksById = new Map((tracksResult.data ?? []).map((track) => [track.id, track]));

  return tagLinks
    .flatMap((row) => {
      const track = tracksById.get(row.starter_track_id);

      return track ? [{ ...track, tagWeight: row.weight }] : [];
    })
    .sort((first, second) => {
      if (first.tagWeight !== second.tagWeight) {
        return second.tagWeight - first.tagWeight;
      }

      if (first.is_featured !== second.is_featured) {
        return first.is_featured ? -1 : 1;
      }

      return first.sort_order - second.sort_order;
    })
    .slice(0, requestedLimit);
}
