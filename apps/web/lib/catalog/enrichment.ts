import "server-only";

import {
  getDeezerAlbum,
  getDeezerTrack,
  type DeezerAlbumResult,
  type DeezerTrackResult,
} from "@/lib/deezer";
import {
  findMusicBrainzArtist,
  findMusicBrainzRecording,
  findMusicBrainzReleaseGroup,
} from "@/lib/catalog/musicbrainz";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];
type EntityRow = Database["public"]["Tables"]["entities"]["Row"];
type CatalogJob =
  Database["public"]["Functions"]["claim_catalog_enrichment_job"]["Returns"][number];

const musicBrainzRequestIntervalMs = 1_100;
let lastMusicBrainzRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForMusicBrainzSlot() {
  const elapsed = Date.now() - lastMusicBrainzRequestAt;
  const waitMs = Math.max(0, musicBrainzRequestIntervalMs - elapsed);

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  lastMusicBrainzRequestAt = Date.now();
}

async function enqueueRelatedTargets(targets: Array<{
  target_type: "artist" | "entity";
  target_id: string;
}>) {
  if (targets.length === 0) {
    return;
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("catalog_enrichment_jobs")
    .upsert(targets, {
      onConflict: "target_type,target_id",
      ignoreDuplicates: true,
    });

  if (error) {
    throw error;
  }
}

async function upsertArtistFromDeezer({
  providerId,
  name,
  imageUrl,
}: {
  providerId: string | null;
  name: string | null;
  imageUrl: string | null;
}) {
  if (!providerId || !name) {
    return null;
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("artists")
    .upsert(
      {
        provider: "deezer",
        provider_id: providerId,
        name,
        image_url: imageUrl,
        deezer_url: `https://www.deezer.com/artist/${providerId}`,
      },
      { onConflict: "provider,provider_id" },
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function upsertAlbumFromDeezer({
  album,
  artistId,
}: {
  album: Pick<
    DeezerAlbumResult,
    "id" | "title" | "artist_name" | "cover_url" | "deezer_url" | "release_date" | "record_type"
  >;
  artistId: string | null;
}) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("entities")
    .upsert(
      {
        provider: "deezer",
        provider_id: album.id,
        type: "album",
        title: album.title,
        artist_name: album.artist_name,
        artist_id: artistId,
        cover_url: album.cover_url,
        deezer_url:
          album.deezer_url ?? `https://www.deezer.com/album/${album.id}`,
        release_date: album.release_date,
        record_type: album.record_type,
      },
      { onConflict: "provider,type,provider_id" },
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function hydrateTrackContext(entity: EntityRow, track: DeezerTrackResult) {
  const supabase = supabaseAdmin();
  const artistId = await upsertArtistFromDeezer({
    providerId: track.artist_id,
    name: track.artist_name,
    imageUrl: track.artist_picture_url ?? null,
  });
  let albumId: string | null = null;

  if (track.album_id && track.album_title) {
    albumId = await upsertAlbumFromDeezer({
      album: {
        id: track.album_id,
        title: track.album_title,
        artist_name: track.artist_name,
        cover_url: track.cover_url,
        deezer_url: track.album_deezer_url ?? null,
        release_date: track.release_date ?? null,
        record_type: track.album_record_type ?? null,
      },
      artistId,
    });
  }

  const { data, error } = await supabase
    .from("entities")
    .update({
      title: track.title,
      artist_name: track.artist_name,
      artist_id: artistId ?? entity.artist_id,
      parent_album_id: albumId ?? entity.parent_album_id,
      cover_url: track.cover_url ?? entity.cover_url,
      deezer_url: track.deezer_url ?? entity.deezer_url,
    })
    .eq("id", entity.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await enqueueRelatedTargets([
    ...(artistId ? [{ target_type: "artist" as const, target_id: artistId }] : []),
    ...(albumId ? [{ target_type: "entity" as const, target_id: albumId }] : []),
  ]);

  return data;
}

async function hydrateAlbumContext(entity: EntityRow, album: DeezerAlbumResult) {
  const supabase = supabaseAdmin();
  const artistId = await upsertArtistFromDeezer({
    providerId: album.artist_id,
    name: album.artist_name,
    imageUrl: null,
  });
  const { data, error } = await supabase
    .from("entities")
    .update({
      title: album.title,
      artist_name: album.artist_name,
      artist_id: artistId ?? entity.artist_id,
      cover_url: album.cover_url ?? entity.cover_url,
      deezer_url: album.deezer_url ?? entity.deezer_url,
      release_date: album.release_date ?? entity.release_date,
      record_type: album.record_type ?? entity.record_type,
    })
    .eq("id", entity.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await enqueueRelatedTargets(
    artistId ? [{ target_type: "artist", target_id: artistId }] : [],
  );

  return data;
}

async function hydrateEntityContext(entity: EntityRow) {
  if (entity.provider !== "deezer") {
    return entity;
  }

  if (entity.type === "track") {
    const track = await getDeezerTrack(entity.provider_id);
    return track ? hydrateTrackContext(entity, track) : entity;
  }

  const album = await getDeezerAlbum(entity.provider_id);
  return album ? hydrateAlbumContext(entity, album) : entity;
}

async function enrichArtist(artist: ArtistRow) {
  await waitForMusicBrainzSlot();
  const match = await findMusicBrainzArtist(artist.name);
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("artists")
    .update({
      musicbrainz_id: match?.id ?? artist.musicbrainz_id,
      musicbrainz_match_score: match?.score ?? null,
      artist_type: match?.type ?? artist.artist_type,
      country_code: match?.countryCode ?? artist.country_code,
      disambiguation: match?.disambiguation ?? artist.disambiguation,
      life_span_begin: match?.lifeSpanBegin ?? artist.life_span_begin,
      life_span_end: match?.lifeSpanEnd ?? artist.life_span_end,
      genres: match?.genres.length ? match.genres : artist.genres,
      musicbrainz_synced_at: new Date().toISOString(),
    })
    .eq("id", artist.id);

  if (error) {
    throw error;
  }
}

async function enrichEntity(entity: EntityRow) {
  const hydratedEntity = await hydrateEntityContext(entity);
  await waitForMusicBrainzSlot();
  const match =
    hydratedEntity.type === "album"
      ? await findMusicBrainzReleaseGroup(
          hydratedEntity.title,
          hydratedEntity.artist_name,
        )
      : await findMusicBrainzRecording(
          hydratedEntity.title,
          hydratedEntity.artist_name,
        );
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("entities")
    .update({
      musicbrainz_recording_id:
        hydratedEntity.type === "track"
          ? match?.id ?? hydratedEntity.musicbrainz_recording_id
          : hydratedEntity.musicbrainz_recording_id,
      musicbrainz_release_group_id:
        hydratedEntity.type === "album"
          ? match?.id ?? hydratedEntity.musicbrainz_release_group_id
          : hydratedEntity.musicbrainz_release_group_id,
      musicbrainz_match_score: match?.score ?? null,
      disambiguation: match?.disambiguation ?? hydratedEntity.disambiguation,
      first_release_date:
        match?.firstReleaseDate ?? hydratedEntity.first_release_date,
      record_type: match?.recordType ?? hydratedEntity.record_type,
      genres: match?.genres.length ? match.genres : hydratedEntity.genres,
      musicbrainz_synced_at: new Date().toISOString(),
    })
    .eq("id", hydratedEntity.id);

  if (error) {
    throw error;
  }
}

async function markJobComplete(jobId: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("catalog_enrichment_jobs")
    .update({ status: "complete", last_error: null })
    .eq("id", jobId);

  if (error) {
    throw error;
  }
}

async function markJobFailed(job: CatalogJob, error: unknown) {
  const supabase = supabaseAdmin();
  const retryMinutes = Math.min(24 * 60, 15 * 2 ** Math.max(0, job.attempts - 1));
  const message = error instanceof Error ? error.message : "Unknown enrichment error";
  const { error: updateError } = await supabase
    .from("catalog_enrichment_jobs")
    .update({
      status: "failed",
      last_error: message.slice(0, 500),
      next_attempt_at: new Date(Date.now() + retryMinutes * 60_000).toISOString(),
    })
    .eq("id", job.job_id);

  if (updateError) {
    console.error("[catalog.enrichment] failed to persist retry state", {
      jobId: job.job_id,
      message: updateError.message,
    });
  }
}

async function claimJob() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.rpc("claim_catalog_enrichment_job");

  if (error) {
    throw error;
  }

  return data[0] ?? null;
}

async function prepareJobs() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.rpc(
    "prepare_catalog_enrichment_jobs",
  );

  if (error) {
    throw error;
  }

  return data ?? 0;
}

async function processJob(job: CatalogJob) {
  const supabase = supabaseAdmin();

  if (job.target_type === "artist") {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .eq("id", job.target_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      await enrichArtist(data);
    }
  } else if (job.target_type === "entity") {
    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("id", job.target_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      await enrichEntity(data);
    }
  } else {
    throw new Error(`Unsupported catalog target: ${job.target_type}`);
  }

  await markJobComplete(job.job_id);
}

export async function processCatalogEnrichmentBatch(limit = 8) {
  const safeLimit = Math.max(1, Math.min(24, Math.floor(limit)));
  const prepared = await prepareJobs();
  let completed = 0;
  let failed = 0;

  for (let index = 0; index < safeLimit; index += 1) {
    const job = await claimJob();

    if (!job) {
      break;
    }

    try {
      await processJob(job);
      completed += 1;
    } catch (error) {
      failed += 1;
      await markJobFailed(job, error);
      console.error("[catalog.enrichment] job failed", {
        jobId: job.job_id,
        targetType: job.target_type,
        targetId: job.target_id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { prepared, completed, failed };
}
