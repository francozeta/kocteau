import "./isolate-upstreams.mjs";

// UI-only fixtures: no users, database writes or external provider requests.
const isolatedFetch = globalThis.fetch;
const rows = Array.from({ length: 32 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  provider: "deezer",
  provider_id: String(900001 + index),
  type: "track",
  title: `Listening fixture ${String(index + 1).padStart(2, "0")}`,
  artist_name: "Interface test",
  cover_url: `http://127.0.0.1:54321/storage/v1/object/public/discovery/${index}.svg`,
  deezer_url: null,
  prompt: "",
  editorial_note: "",
  is_featured: true,
  sort_order: index,
  created_at: "2026-01-01T00:00:00Z",
}));

globalThis.fetch = (input, init) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL
      ? String(input)
      : input.url,
  );
  if (url.origin === "http://127.0.0.1:54321") {
    return Promise.resolve(
      Response.json(url.pathname === "/rest/v1/starter_tracks" ? rows : []),
    );
  }
  return isolatedFetch(input, init);
};
