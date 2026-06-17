# Apple Music playlist import

Kocteau can draft an Apple Music playlist import without adding tracks manually.

```bash
pnpm import:apple-playlist "https://music.apple.com/pe/playlist/v%C3%A9rt/pl.u-BNA6yAXtRPWAWdv" --out tmp/apple-music/vert.json
```

The importer tries the public Apple Music page first. Public playlist pages may include a `serialized-server-data` payload with `trackLockup` rows; when present, Kocteau extracts track title, artist, album, duration, Apple Music URL, Apple Music ID, position, and artwork.

If Apple does not expose track rows in the public HTML, set a developer token and prefer the official API:

```bash
$env:APPLE_MUSIC_DEVELOPER_TOKEN="..."
pnpm import:apple-playlist "https://music.apple.com/pe/playlist/..." --prefer-api --out tmp/apple-music/playlist.json
```

The output includes:

- `playlist`: normalized Apple Music playlist metadata.
- `tracks`: normalized track rows.
- `kocteau.playlist`: a playlist draft.
- `kocteau.entities`: track entity drafts with `provider: "apple_music"`.

## Mirror into Starter Picks

For the one-off Vért import, Kocteau can mirror the Apple Music playlist into
Starter Picks through Deezer matches:

```bash
pnpm sync:apple-starter-source "https://music.apple.com/pe/playlist/v%C3%A9rt/pl.u-BNA6yAXtRPWAWdv" \
  --out supabase/scripts/generated/apple-vert-starter-sync.sql \
  --tag-slugs electronic,nocturnal,uk-underground,textural,deep-cuts \
  --min-score 0.78 \
  --limit 5
```

Run order for Supabase Cloud:

1. Run `supabase/scripts/maintenance/starter-source-playlists.sql` in the SQL Editor.
2. Run `supabase/scripts/generated/apple-vert-starter-sync.sql` in the SQL Editor.
3. Open Starter Studio and review `match_failed` rows separately if needed.

The generated SQL:

- upserts the Apple Music source into `starter_sources`;
- upserts matched Deezer tracks into `starter_tracks`;
- links every source row in `starter_source_items`;
- applies the playlist-level starter tags;
- marks removed Apple playlist rows as `removed`;
- archives removed starter picks only when no active source row still points at them.

Current production schema notes:

- Kocteau's `entities` table is still constrained to `provider = 'deezer'`.
- Treat Apple Music output as an import draft until a provider/catalog migration is planned.
- Keep generated JSON under `tmp/`; it is ignored by git.
