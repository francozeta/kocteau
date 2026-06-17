#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  exportAppleMusicPlaylistJson,
  importAppleMusicPlaylist,
} from "../lib/apple-music";

type CliOptions = {
  urls: string[];
  out: string | null;
  pretty: boolean;
  preferApi: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    urls: [],
    out: null,
    pretty: true,
    preferApi: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--out") {
      options.out = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--compact") {
      options.pretty = false;
      continue;
    }

    if (arg === "--prefer-api") {
      options.preferApi = true;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (arg) {
      options.urls.push(arg);
    }
  }

  if (options.urls.length === 0) {
    throw new Error(
      "Usage: pnpm import:apple-playlist <apple-music-playlist-url> [more urls] [--out tmp/apple-music-playlist.json] [--prefer-api]",
    );
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const results = await Promise.all(
    options.urls.map((url) =>
      importAppleMusicPlaylist(url, {
        preferApi: options.preferApi,
      }),
    ),
  );
  const payload = results.length === 1 ? results[0] : results;
  const json =
    results.length === 1
      ? exportAppleMusicPlaylistJson(results[0], options.pretty)
      : JSON.stringify(payload, null, options.pretty ? 2 : 0);

  if (!options.out) {
    process.stdout.write(`${json}\n`);
    return;
  }

  const outPath = resolve(options.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${json}\n`, "utf8");
  process.stdout.write(`Wrote ${outPath}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown Apple Music import error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
