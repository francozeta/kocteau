import {
  getDeezerAlbum,
  getDeezerAlbumTracks,
  getDeezerArtist,
  getDeezerArtistAlbums,
  getDeezerArtistTopTracks,
  getDeezerRelatedArtists,
  getDeezerTrack,
  type DeezerTrackResult,
} from "../deezer";
import { withSearchDeadline } from "../search/deadline";
import {
  selectTrackRecommendationGroups,
  type TrackRecommendationCandidate,
} from "../recommendations/track-recommendation-ranking";
import { discoveryUnit } from "./variation";

const catalog = {
  track: getDeezerTrack,
  artist: getDeezerArtist,
  album: getDeezerAlbum,
  related: getDeezerRelatedArtists,
  top: getDeezerArtistTopTracks,
  albums: getDeezerArtistAlbums,
  tracks: getDeezerAlbumTracks,
};

type Input = {
  providerId: string;
  seedType: "track" | "album" | "artist";
  lane: "fast" | "deep" | "full";
  variation: number;
  signal?: AbortSignal;
};

function ordered<T>(values: T[], identity: (value: T) => string, salt: string) {
  return values.toSorted(
    (a, b) =>
      discoveryUnit(salt + ":" + identity(b)) -
      discoveryUnit(salt + ":" + identity(a)),
  );
}

function candidate(
  track: DeezerTrackResult,
  seed: DeezerTrackResult,
  variation: number,
  deep: boolean,
): TrackRecommendationCandidate {
  const sameArtist = track.artist_id === seed.artist_id;
  const durationDistance =
    seed.duration_seconds && track.duration_seconds
      ? Math.abs(Math.log(track.duration_seconds / seed.duration_seconds))
      : 1;
  const seedYear = Number(seed.release_date?.slice(0, 4));
  const year = Number(track.release_date?.slice(0, 4));
  const eraScore =
    seedYear && year ? Math.max(0, 6 - Math.abs(seedYear - year)) : 0;
  return {
    id: `deezer-discovery:${track.provider_id}`,
    provider: "deezer",
    provider_id: track.provider_id,
    type: "track",
    title: track.title,
    artist_name: track.artist_name,
    cover_url: track.cover_url,
    deezer_url: track.deezer_url,
    href: `/track/deezer/${track.provider_id}`,
    source: deep ? "deezer-deep-cut" : "deezer-related",
    sourceLabel: deep ? "Deep cut" : "Nearby",
    reason: deep
      ? `Another release in ${seed.artist_name}'s catalog.`
      : sameArtist
        ? `Another release by ${seed.artist_name}.`
        : `Connected through ${seed.artist_name}'s related artists.`,
    // Context is metadata, not a claim of audio similarity. Duration/era are
    // modest preferences; identity and exploration diversify the entry points.
    score:
      55 +
      Math.max(0, 8 - durationDistance * 10) +
      eraScore +
      discoveryUnit(`${seed.provider_id}:${variation}:${track.provider_id}`) *
        12,
    catalogRank: track.rank,
    artistFanCount: track.artist_fan_count,
  };
}

export async function getDiscoveryCandidates(input: Input, source = catalog) {
  return withSearchDeadline(
    async (signal) => {
      const options = { signal, throwOnError: true };
      let seed: DeezerTrackResult | null;
      if (input.seedType === "track")
        seed = await source.track(input.providerId, options);
      else if (input.seedType === "artist") {
        const artist = await source.artist(input.providerId, options);
        seed = artist
          ? ((await source.top(artist, 1, options))[0] ?? null)
          : null;
      } else {
        const album = await source.album(input.providerId, options);
        seed = album?.artist_id
          ? ((
              await source.tracks(
                album,
                {
                  id: album.artist_id,
                  name: album.artist_name ?? "Unknown artist",
                  fan_count: null,
                },
                1,
                options,
              )
            )[0] ?? null)
          : null;
      }
      if (!seed?.artist_id) return null;

      const artist = {
        id: seed.artist_id,
        name: seed.artist_name ?? "Unknown artist",
        fan_count: seed.artist_fan_count,
      };
      const salt = `${seed.provider_id}:${seed.album_id ?? ""}:${input.variation}`;
      const tracks: DeezerTrackResult[] = [];
      const deepTracks: DeezerTrackResult[] = [];
      let failures = 0;
      // Independent successes remain usable if another branch reaches its deadline.
      async function collect(
        run: () => Promise<DeezerTrackResult[]>,
        deep = false,
      ) {
        try {
          (deep ? deepTracks : tracks).push(...(await run()));
        } catch (error) {
          if (input.signal?.aborted) throw error;
          failures += 1;
        }
      }
      const related = async () => {
        const artists = ordered(
          await source.related(artist.id, 24, options),
          (item) => item.id,
          salt,
        ).filter((item) => item.id !== artist.id);
        const neighbors =
          input.lane === "deep"
            ? artists.slice(3, 6)
            : artists.slice(0, input.lane === "full" ? 6 : 3);
        await Promise.all(
          neighbors.map((neighbor) =>
            collect(() => source.top(neighbor, 10, options)),
          ),
        );
        return [];
      };
      await Promise.all([
        collect(related),
        input.lane !== "deep"
          ? collect(() => source.top(artist, 16, options))
          : Promise.resolve(),
        input.lane !== "fast"
          ? collect(async () => {
              const albums = ordered(
                await source.albums(artist.id, 16, options),
                (item) => item.id,
                salt,
              )
                .filter(
                  (album) =>
                    album.id !== seed!.album_id &&
                    (album.record_type === "album" ||
                      album.record_type === null),
                )
                .slice(0, 2);
              await Promise.all(
                albums.map((album) =>
                  collect(
                    () => source.tracks(album, artist, 12, options),
                    true,
                  ),
                ),
              );
              return [];
            }, true)
          : Promise.resolve(),
      ]);
      input.signal?.throwIfAborted();
      if (!tracks.length && !deepTracks.length && failures)
        throw new Error("Discovery sources unavailable");
      const valid = (track: DeezerTrackResult) =>
        track.provider_id !== seed!.provider_id &&
        Boolean(track.cover_url) &&
        track.cover_url?.split("?")[0] !== seed!.cover_url?.split("?")[0];
      return {
        seedProviderId: seed.provider_id,
        variation: input.variation,
        partial: failures > 0,
        groups: selectTrackRecommendationGroups({
          currentProviderId: seed.provider_id,
          relatedCandidates: tracks
            .filter(valid)
            .map((track) => candidate(track, seed!, input.variation, false)),
          deepCutCandidates: deepTracks
            .filter(valid)
            .map((track) => candidate(track, seed!, input.variation, true)),
          localSignalCandidates: [],
          perGroupLimit: 8,
        }),
      };
    },
    { signal: input.signal, timeoutMs: 4_500 },
  );
}
