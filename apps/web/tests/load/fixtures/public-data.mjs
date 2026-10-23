import { createServer } from "node:http";

let db = "healthy";
let provider = "healthy";
const stats = { db: 0, provider: 0, active: 0, peak: 0, closed: 0 };
const paths = new Set([
  "/rest/v1/entities", "/rest/v1/artists", "/rest/v1/starter_tracks",
  "/rest/v1/entity_preference_tags", "/rest/v1/reviews",
  "/rest/v1/rpc/get_entity_review_summary",
  "/provider/search", "/provider/search/artist", "/provider/search/album", "/provider/artist/1041/top",
]);
const row = {
  id: "00000000-0000-4000-8000-000000000001", short_id: "000000000000",
  provider: "deezer", provider_id: "951796", type: "track", title: "Sea, Swallow Me",
  artist_name: "Cocteau Twins", artist_id: null, parent_album_id: null, cover_url: null, deezer_url: null,
  release_date: null, record_type: null, disambiguation: null, musicbrainz_recording_id: null,
  musicbrainz_release_group_id: null, first_release_date: null, genres: [],
};
const track = {
  id: 951796, title: "Sea, Swallow Me", title_short: "Sea, Swallow Me",
  link: "https://www.deezer.com/track/951796", rank: 100000,
  artist: { id: 1041, name: "Cocteau Twins" },
  album: { id: 107083, title: "The Moon and the Melodies", record_type: "album" },
};

createServer((req, res) => {
  const url = new URL(req.url, "http://fixture");
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/__fixture/config") {
    db = url.searchParams.get("db") || db;
    provider = url.searchParams.get("provider") || provider;
    res.end(JSON.stringify({ db, provider, stats }));
    return;
  }
  if (url.pathname === "/__fixture/stats") {
    res.end(JSON.stringify({ db, provider, stats }));
    return;
  }
  if (!paths.has(url.pathname)) {
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Unknown fixture endpoint" }));
    return;
  }

  const external = url.pathname.startsWith("/provider/");
  stats[external ? "provider" : "db"]++;
  stats.active++;
  stats.peak = Math.max(stats.peak, stats.active);
  let timer;
  res.once("close", () => {
    stats.active--;
    stats.closed++;
    clearTimeout(timer);
  });
  const mode = external ? provider : db;
  if (mode === "stall") return;

  timer = setTimeout(() => {
    if (mode === "fail") {
      res.writeHead(503, { "Retry-After": "0" });
      res.end(JSON.stringify({ message: "fixture unavailable" }));
      return;
    }
    if (external) {
      const path = url.pathname.slice(9);
      const data = path === "/search/artist" ? [{ id: 1041, name: "Cocteau Twins", nb_fan: 100000 }]
        : path === "/search/album" ? [] : [track];
      res.end(JSON.stringify({ data }));
      return;
    }
    const table = url.pathname.split("/").at(-1);
    let result = [];
    if (table === "entities" && url.searchParams.get("type") !== "eq.album") result = [row];
    if (table === "get_entity_review_summary") result = [{ review_count: 0, average_rating: null }];
    const single = String(req.headers.accept || "").includes("application/vnd.pgrst.object");
    res.end(JSON.stringify(single ? result[0] || null : result));
  }, 30);
}).listen(54321, "127.0.0.1", () => console.log("isolated fixture ready"));
