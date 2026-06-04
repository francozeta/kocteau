import "server-only";

import {
  getCandidateSourceTracks,
  type DeezerCandidateSeedArtist,
} from "@/lib/deezer-candidate-source";
import { getDeezerTrack, type DeezerTrackResult } from "@/lib/deezer";
import { measureServerTask } from "@/lib/perf";
import { getPublicStarterTracks } from "@/lib/queries/starter";
import type { EntityTasteTag } from "@/lib/queries/entities";
import {
  getTrackRecommendationSeedLabel,
  selectTrackRecommendationGroups,
  type TrackRecommendationCandidate,
  type TrackRecommendationGroup,
} from "@/lib/recommendations/track-recommendation-ranking";
import { buildStarterCandidateTracks } from "@/lib/starter/candidates";
import { supabasePublic } from "@/lib/supabase/public";

export type TrackRecommendation = TrackRecommendationCandidate;
export type { TrackRecommendationGroup };

type EntityLinkRow = {
  id: string;
  provider_id: string;
};

type LocalSignalRow = {
  weight: number;
  preference_tags: {
    id: string;
    kind: EntityTasteTag["kind"];
    label: string;
  } | null;
  entities: {
    id: string;
    provider: string;
    provider_id: string;
    type: "track" | "album";
    title: string;
    artist_name: string | null;
    cover_url: string | null;
    deezer_url: string | null;
  } | null;
};

type TrackRecommendationOptions = {
  currentEntityId?: string | null;
  currentProviderId: string;
  title: string;
  artistName?: string | null;
  tags?: EntityTasteTag[];
  limit?: number;
};

const defaultRecommendationLimit = 18;

function getSeedArtistFromTrack(track: DeezerTrackResult | null): DeezerCandidateSeedArtist | null {
  if (!track?.artist_id || !track.artist_name) {
    return null;
  }

  return {
    id: track.artist_id,
    name: track.artist_name,
    fan_count: track.artist_fan_count,
  };
}

function getSignalMatchReason(labels: string[]) {
  const [primaryLabel] = labels;

  if (!primaryLabel) {
    return "Shared Kocteau taste signal.";
  }

  return `Also tagged ${primaryLabel.toLowerCase()}.`;
}

async function getLocalSignalCandidates({
  currentEntityId,
  currentProviderId,
  tags,
  limit,
}: {
  currentEntityId?: string | null;
  currentProviderId: string;
  tags: EntityTasteTag[];
  limit: number;
}): Promise<TrackRecommendationCandidate[]> {
  if (!currentEntityId || tags.length === 0) {
    return [];
  }

  const currentTags = new Map(tags.map((tag) => [tag.id, tag]));
  const tagIds = Array.from(currentTags.keys());
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("entity_preference_tags")
    .select(
      `
        weight,
        preference_tags (
          id,
          kind,
          label
        ),
        entities!inner (
          id,
          provider,
          provider_id,
          type,
          title,
          artist_name,
          cover_url,
          deezer_url
        )
      `,
    )
    .in("tag_id", tagIds)
    .neq("entity_id", currentEntityId)
    .eq("entities.provider", "deezer")
    .eq("entities.type", "track")
    .returns<LocalSignalRow[]>();

  if (error) {
    console.error("[track-recommendations.getLocalSignalCandidates] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
      currentEntityId,
    });

    return [];
  }

  const scoredByEntityId = new Map<
    string,
    {
      entity: NonNullable<LocalSignalRow["entities"]>;
      labels: string[];
      score: number;
    }
  >();

  (data ?? []).forEach((row) => {
    if (!row.entities || !row.preference_tags) {
      return;
    }

    if (row.entities.provider_id === currentProviderId) {
      return;
    }

    const currentTag = currentTags.get(row.preference_tags.id);
    const score = Math.max(0.1, row.weight) * Math.max(0.1, currentTag?.weight ?? 1);
    const existing = scoredByEntityId.get(row.entities.id);

    if (!existing) {
      scoredByEntityId.set(row.entities.id, {
        entity: row.entities,
        labels: [row.preference_tags.label],
        score,
      });
      return;
    }

    existing.score += score;

    if (!existing.labels.includes(row.preference_tags.label)) {
      existing.labels.push(row.preference_tags.label);
    }
  });

  return Array.from(scoredByEntityId.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ entity, labels, score }) => ({
      id: entity.id,
      provider: "deezer",
      provider_id: entity.provider_id,
      type: "track",
      title: entity.title,
      artist_name: entity.artist_name,
      cover_url: entity.cover_url,
      deezer_url: entity.deezer_url,
      href: `/track/${entity.id}`,
      reason: getSignalMatchReason(labels),
      source: "local-signal",
      sourceLabel: "Kocteau signal",
      score,
    }));
}

function mapDeezerCandidate({
  candidate,
  sourceLabel,
}: {
  candidate: ReturnType<typeof buildStarterCandidateTracks>[number];
  sourceLabel: string;
}): TrackRecommendationCandidate {
  return {
    id: candidate.candidate_id,
    provider: "deezer",
    provider_id: candidate.provider_id,
    type: "track",
    title: candidate.title,
    artist_name: candidate.artist_name,
    cover_url: candidate.cover_url,
    deezer_url: candidate.deezer_url,
    href: `/track/deezer/${candidate.provider_id}`,
    reason: candidate.reason,
    source: "related-seed",
    sourceLabel,
    score: candidate.score,
  };
}

async function getDeezerCandidateRecommendations({
  currentProviderId,
  query,
  limit,
  seedArtist,
}: {
  currentProviderId: string;
  query: string;
  limit: number;
  seedArtist: DeezerCandidateSeedArtist | null;
}) {
  const sourceTracks = await getCandidateSourceTracks({
    mode: "related-seed",
    query,
    limit: Math.max(limit * 3, 12),
    seedArtist,
  });
  const candidates = buildStarterCandidateTracks({
    source: "related-seed",
    seedLabel: sourceTracks.seedLabel,
    tracks: sourceTracks.tracks,
    existingProviderIds: new Set([currentProviderId]),
    limit: Math.max(limit * 2, 12),
  });

  return candidates.map((candidate) =>
    mapDeezerCandidate({
      candidate,
      sourceLabel: "Related",
    }),
  );
}

async function getEditorialFallbackCandidates({
  currentEntityId,
  currentProviderId,
  limit,
}: {
  currentEntityId?: string | null;
  currentProviderId: string;
  limit: number;
}) {
  const tracks = await getPublicStarterTracks({
    limit: Math.max(limit * 2, 8),
    seed: currentEntityId ?? currentProviderId,
    contextKey: `track:${currentEntityId ?? currentProviderId}`,
  });

  return tracks
    .filter((track) => track.provider_id !== currentProviderId)
    .map((track) => ({
      id: track.id,
      provider: "deezer" as const,
      provider_id: track.provider_id,
      type: "track" as const,
      title: track.title,
      artist_name: track.artist_name,
      cover_url: track.cover_url,
      deezer_url: track.deezer_url,
      href: `/track/deezer/${track.provider_id}`,
      reason: "A curated starter pick from Kocteau.",
      source: "editorial-fallback" as const,
      sourceLabel: "Curated",
      score: track.score,
    }));
}

async function resolveRecommendationLinks(groups: TrackRecommendationGroup[]) {
  const providerIds = Array.from(
    new Set(
      groups.flatMap((group) =>
        group.recommendations.map((track) => track.provider_id).filter(Boolean),
      ),
    ),
  );

  if (providerIds.length === 0) {
    return groups;
  }

  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("entities")
    .select("id, provider_id")
    .eq("provider", "deezer")
    .eq("type", "track")
    .in("provider_id", providerIds)
    .returns<EntityLinkRow[]>();

  if (error) {
    console.error("[track-recommendations.resolveRecommendationLinks] failed", {
      code: error.code ?? null,
      message: error.message ?? null,
      providerCount: providerIds.length,
    });

    return groups;
  }

  const localEntityByProviderId = new Map(
    (data ?? []).map((entity) => [entity.provider_id, entity.id]),
  );

  return groups.map((group) => ({
    ...group,
    recommendations: group.recommendations.map((track) => {
      const entityId = localEntityByProviderId.get(track.provider_id);

      if (!entityId) {
        return track;
      }

      return {
        ...track,
        href: `/track/${entityId}`,
      };
    }),
  }));
}

export async function getTrackRecommendations({
  currentEntityId,
  currentProviderId,
  title,
  artistName,
  tags = [],
  limit = defaultRecommendationLimit,
}: TrackRecommendationOptions) {
  return measureServerTask(
    "getTrackRecommendations",
    async () => {
      const requestedLimit = Math.max(1, Math.min(limit, 24));
      const [seedTrack, localSignalCandidates] = await Promise.all([
        getDeezerTrack(currentProviderId).catch(() => null),
        getLocalSignalCandidates({
          currentEntityId,
          currentProviderId,
          tags,
          limit: requestedLimit,
        }),
      ]);
      const seedArtist = getSeedArtistFromTrack(seedTrack);
      const seedLabel = getTrackRecommendationSeedLabel({
        title,
        artistName: seedArtist?.name ?? artistName,
      });
      const [relatedCandidates, editorialFallbackCandidates] =
        await Promise.all([
          getDeezerCandidateRecommendations({
            currentProviderId,
            query: seedLabel,
            limit: requestedLimit,
            seedArtist,
          }),
          getEditorialFallbackCandidates({
            currentEntityId,
            currentProviderId,
            limit: requestedLimit,
          }),
        ]);

      const groups = selectTrackRecommendationGroups({
        currentProviderId,
        relatedCandidates,
        localSignalCandidates,
        editorialFallbackCandidates,
        perGroupLimit: requestedLimit,
      });

      return resolveRecommendationLinks(groups);
    },
    {
      currentEntityId,
      currentProviderId,
      tagCount: tags.length,
      limit,
    },
  );
}
