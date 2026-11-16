import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../../app/api/discovery/map/route";

const nativeFetch = globalThis.fetch;
test.afterEach(() => {
  globalThis.fetch = nativeFetch;
});
const request = (query = "") =>
  new Request(
    `http://localhost/api/discovery/map?providerId=123&lane=fast${query}`,
  );

test("discovery uses canonical track identity and returns only its public candidate pool", async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/track/123"))
      return Response.json({
        id: 123,
        title: "Canonical song",
        artist: { id: 45, name: "Canonical artist" },
        album: { id: 9, cover_medium: "https://example.com/seed.jpg" },
      });
    if (url.includes("/related"))
      return Response.json({ data: [{ id: 80, name: "Related artist" }] });
    if (url.includes("/top")) {
      const artist = url.includes("/80/") ? 80 : 45;
      return Response.json({
        data: Array.from({ length: 8 }, (_, i) => ({
          id: artist * 100 + i,
          title: `Song ${i}`,
          artist: { id: artist, name: `Artist ${artist}` },
          album: {
            id: artist * 10 + i,
            cover_medium: `https://example.com/${artist}-${i}.jpg`,
          },
        })),
      });
    }
    throw new Error(`Unexpected catalog call: ${url}`);
  }) as typeof fetch;
  const response = await GET(request("&variation=7&title=Client+title&artistName=Client+artist"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.seedProviderId, "123");
  assert.equal(body.variation, 7);
  assert.ok(body.groups.length > 0);
  assert.ok(body.groups.flatMap((group: { recommendations: { artist_provider_id?: string }[] }) =>
    group.recommendations).every((item: { artist_provider_id?: string }) =>
    item.artist_provider_id === "45" || item.artist_provider_id === "80"));
  assert.match(JSON.stringify(body.groups), /Canonical artist/);
  assert.doesNotMatch(
    JSON.stringify(body),
    /Client artist|Client title|starter/,
  );
  assert.ok(response.headers.get("Cache-Control")?.includes("public"));
  assert.ok(calls.length <= 6);
});

test("provider failures are retryable, uncached failures rather than empty recommendations", async () => {
  globalThis.fetch = (async () =>
    Response.json(
      { error: { message: "unavailable" } },
      { status: 503 },
    )) as typeof fetch;
  const response = await GET(request());
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("invalid or unbounded variants cannot trigger provider requests", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new Error("unexpected");
  }) as typeof fetch;
  for (const variant of ["-1", "16", "1.5", "infinity"]) {
    assert.equal((await GET(request(`&variation=${variant}`))).status, 400);
  }
  assert.equal(calls, 0);
});
