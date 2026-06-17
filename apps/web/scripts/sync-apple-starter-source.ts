#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getDeezerTrack } from "../lib/deezer";
import { matchApplePlaylistTrackToDeezer } from "../lib/apple-music/deezer-match";
import { getEraSlugFromReleaseDate } from "../lib/apple-music/era";
import { generateStarterSourceSql } from "../lib/apple-music/starter-source-sql";
import { importAppleMusicPlaylist } from "../lib/apple-music";

type CliOptions = {
  url: string | null;
  out: string | null;
  collectionSlug: string;
  tagSlugs: string[];
  minScore: number;
  limit: number;
  preferApi: boolean;
};

type ParsedCliOptions = Omit<CliOptions, "url"> & {
  url: string;
};

const defaultTagSlugs = [
  "electronic",
  "nocturnal",
  "uk-underground",
  "textural",
  "deep-cuts",
] as const;

const defaultCollectionSlug = "starter-picks";

function parseTagSlugs(value: string | null | undefined) {
  if (!value) {
    return [...defaultTagSlugs];
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseNumberOption(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv: string[]): ParsedCliOptions {
  const options: CliOptions = {
    url: null,
    out: null,
    collectionSlug: defaultCollectionSlug,
    tagSlugs: [...defaultTagSlugs],
    minScore: 0.78,
    limit: 5,
    preferApi: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--out") {
      options.out = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--collection") {
      options.collectionSlug = argv[index + 1] ?? defaultCollectionSlug;
      index += 1;
      continue;
    }

    if (arg === "--tag-slugs") {
      options.tagSlugs = parseTagSlugs(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--min-score") {
      options.minScore = parseNumberOption(argv[index + 1], options.minScore);
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      options.limit = Math.max(1, Math.floor(parseNumberOption(argv[index + 1], options.limit)));
      index += 1;
      continue;
    }

    if (arg === "--prefer-api") {
      options.preferApi = true;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.url = arg ?? null;
  }

  if (!options.url) {
    throw new Error(
      "Usage: pnpm sync:apple-starter-source <apple-music-playlist-url> --out supabase/scripts/generated/vert-starter-sync.sql",
    );
  }

  return {
    ...options,
    url: options.url,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const importResult = await importAppleMusicPlaylist(options.url, {
    preferApi: options.preferApi,
  });
  const matches = [];

  for (const track of importResult.tracks) {
    const match = await matchApplePlaylistTrackToDeezer(track, {
      limit: options.limit,
      minScore: options.minScore,
    });
    const detailedMatch = match.match
      ? await getDeezerTrack(match.match.provider_id)
      : null;
    const releaseDate =
      detailedMatch?.release_date ?? match.match?.release_date ?? null;
    const enrichedMatch = {
      ...match,
      match: detailedMatch
        ? {
            ...match.match,
            ...detailedMatch,
            cover_url: match.match?.cover_url ?? detailedMatch.cover_url,
          }
        : match.match,
      releaseDate,
      eraSlug: getEraSlugFromReleaseDate(releaseDate),
    };

    matches.push(enrichedMatch);
    process.stderr.write(
      `${track.position}. ${track.title} - ${track.artist ?? "Unknown"} => ${
        enrichedMatch.match
          ? `${enrichedMatch.match.title} - ${
              enrichedMatch.match.artist_name ?? "Unknown"
            } (${enrichedMatch.score.toFixed(3)}${
              enrichedMatch.eraSlug ? `, ${enrichedMatch.eraSlug}` : ""
            })`
          : "match failed"
      }\n`,
    );
    await sleep(120);
  }

  const sql = generateStarterSourceSql({
    importResult,
    matches,
    collectionSlug: options.collectionSlug,
    tagSlugs: options.tagSlugs,
    minMatchScore: options.minScore,
  });

  if (!options.out) {
    process.stdout.write(sql);
    return;
  }

  const outPath = resolve(options.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, sql, "utf8");
  process.stdout.write(`Wrote ${outPath}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown Apple starter sync error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
