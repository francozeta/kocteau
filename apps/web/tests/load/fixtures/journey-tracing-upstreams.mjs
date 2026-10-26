import { createServer } from "node:http";
import { gunzipSync } from "node:zlib";
import { setTimeout as delay } from "node:timers/promises";

export async function startJourneyFixture() {
  const entity = {
    id: "10000000-1234-4000-8000-000000000001",
    short_id: "100000001234",
    provider: "deezer",
    provider_id: "42",
    type: "track",
    title: "Fixture track",
    artist_name: "Fixture artist",
    artist_id: null,
    parent_album_id: null,
    cover_url: null,
    deezer_url: null,
    release_date: null,
    record_type: null,
    disambiguation: null,
    created_at: "2026-10-25T00:00:00Z",
    updated_at: "2026-10-25T00:00:00Z",
    musicbrainz_recording_id: null,
    musicbrainz_release_group_id: null,
    first_release_date: null,
    genres: [],
  };
  const author = {
    id: "20000000-1234-4000-8000-000000000001",
    username: "fixture-listener",
    display_name: "Fixture listener",
    avatar_url: null,
  };
  const reviews = Array.from({ length: 14 }, (_, index) => {
    const prefix = (index + 1).toString(16).padStart(8, "0");
    return {
      id: prefix + "-1234-4000-8000-000000000001",
      short_id: prefix + "1234",
      title: "Fixture review " + (index + 1),
      body: "Synthetic listening note for isolated trace verification.",
      rating: 4,
      likes_count: 0,
      comments_count: 0,
      is_pinned: false,
      created_at: new Date(Date.UTC(2026, 9, 25, 12, 0, index)).toISOString(),
      entity_id: entity.id,
      author_id: author.id,
      updated_at: "2026-10-25T00:00:00Z",
      entities: entity,
      author,
    };
  });
  const state = {
    fail: false,
    headerDelayMs: 80,
    bodyDelayMs: 0,
    reads: 0,
    transactions: [],
    envelopeTypes: {},
  };
  const origin = createServer(async (req, res) => {
    const url = new URL(req.url, "http://fixture.local");
    res.setHeader("Content-Type", "application/json");
    if (url.pathname.startsWith("/provider/")) {
      res.end('{"data":[]}');
      return;
    }
    if (!url.pathname.startsWith("/rest/v1/")) {
      res.writeHead(404).end("{}");
      return;
    }
    state.reads++;
    const { fail, headerDelayMs, bodyDelayMs } = state;
    if (headerDelayMs) await delay(headerDelayMs);
    if (fail) {
      res.writeHead(503).end(
        JSON.stringify({
          code: "FIXTURE_UNAVAILABLE",
          message: "Isolated synthetic Data API failure",
        }),
      );
      return;
    }
    const table = url.pathname.split("/").at(-1);
    let rows =
      table === "reviews" ? reviews : table === "entities" ? [entity] : [];
    const short = url.searchParams.get("short_id"),
      id = url.searchParams.get("id");
    if (short) {
      const prefix = short.replace(/^(eq|like)\./, "").replace(/%$/, "");
      rows = rows.filter((x) => x.short_id.startsWith(prefix));
    }
    if (id) rows = rows.filter((x) => x.id === id.replace(/^eq\./, ""));
    if (url.searchParams.get("type") === "eq.album") rows = [];
    if (table === "get_entity_review_summary")
      rows = [{ review_count: reviews.length, average_rating: 4 }];
    const limit = Number(url.searchParams.get("limit"));
    if (limit > 0) rows = rows.slice(0, limit);
    if (url.searchParams.get("select") === "id")
      rows = rows.map((x) => ({ id: x.id }));
    const single = String(req.headers.accept || "").includes(
      "application/vnd.pgrst.object",
    );
    const json = JSON.stringify(single ? (rows[0] ?? null) : rows);
    if (bodyDelayMs) {
      res.writeHead(200);
      res.write(json.slice(0, 1));
      await delay(bodyDelayMs);
      res.end(json.slice(1));
    } else res.end(json);
  });
  const collector = createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, sentry-trace, baggage, x-sentry-auth",
    );
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }
    if (!req.url?.startsWith("/api/1/envelope/")) {
      res.writeHead(404).end();
      return;
    }
    let body;
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
      if (req.headers["content-encoding"] === "gzip") body = gunzipSync(body);
    } catch {
      if (!res.destroyed) res.writeHead(400).end("{}");
      return;
    }
    const lines = body.toString().split("\n");
    for (let i = 1; i + 1 < lines.length; i += 2) {
      try {
        const header = JSON.parse(lines[i]);
        state.envelopeTypes[header.type] =
          (state.envelopeTypes[header.type] || 0) + 1;
        if (header.type === "transaction")
          state.transactions.push(JSON.parse(lines[i + 1]));
      } catch {
        /* Ignore non-JSON attachment items. */
      }
    }
    res.writeHead(200, { "Content-Type": "application/json" }).end("{}");
  });
  const listen = (server, port) =>
    new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.removeListener("error", reject);
        resolve(server.address().port);
      });
    });
  try {
    await listen(origin, 54321);
    const collectorPort = await listen(collector, 0);
    return {
      state,
      entity,
      reviews,
      dsn: "http://public@127.0.0.1:" + collectorPort + "/1",
      close: async () => {
        for (const server of [origin, collector]) server.closeAllConnections();
        await Promise.all(
          [origin, collector].map(
            (server) => new Promise((resolve) => server.close(resolve)),
          ),
        );
      },
    };
  } catch (error) {
    origin.closeAllConnections();
    origin.close();
    collector.close();
    throw error;
  }
}
