import assert from "node:assert/strict";
import test from "node:test";

import {
  DeezerRequestError,
  getDeezerErrorDetails,
  getDeezerTrack,
  isDeezerProviderId,
  searchDeezerTracks,
} from "./deezer.ts";

const originalFetch = globalThis.fetch;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("Deezer track search retries transient upstream failures", async () => {
  let fetchCount = 0;

  globalThis.fetch = (async () => {
    fetchCount += 1;

    if (fetchCount === 1) {
      return jsonResponse({ error: { message: "temporary" } }, 502);
    }

    return jsonResponse({
      data: [
        {
          id: 123,
          title: "Alison",
          link: "https://www.deezer.com/track/123",
          rank: 120000,
          artist: {
            id: 45,
            name: "Slowdive",
            nb_fan: 42000,
          },
          album: {
            cover_medium: "https://example.com/cover.jpg",
          },
        },
      ],
    });
  }) as typeof fetch;

  const results = await searchDeezerTracks("slowdive", 1);

  assert.equal(fetchCount, 2);
  assert.equal(results[0]?.provider_id, "123");
  assert.equal(results[0]?.title, "Alison");
  assert.equal(results[0]?.artist_name, "Slowdive");
});

test("Deezer track lookup degrades to null when the upstream request fails", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("network unavailable");
  }) as typeof fetch;

  const result = await getDeezerTrack("123");

  assert.equal(result, null);
});

test("Deezer track lookup rejects malformed provider ids before fetching", async () => {
  let fetchCount = 0;

  globalThis.fetch = (async () => {
    fetchCount += 1;
    return jsonResponse({ id: 123, title: "Alison" });
  }) as typeof fetch;

  assert.equal(isDeezerProviderId("123"), true);
  assert.equal(isDeezerProviderId("../../123"), false);
  assert.equal(await getDeezerTrack("../../123"), null);
  assert.equal(fetchCount, 0);
});

test("Deezer error log details keep only safe operational context", () => {
  const details = getDeezerErrorDetails(
    new DeezerRequestError("Deezer search request failed", 502),
  );

  assert.deepEqual(details, {
    status: 502,
    message: "Deezer search request failed",
  });
});
