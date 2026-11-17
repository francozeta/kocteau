import assert from "node:assert/strict";

const homeQueryLimits = new Map([
  ["reviews", "7"],
  ["starter_tracks", "72"],
]);
const isHomeQuery = ({ table, limit }) => homeQueryLimits.get(table) === limit;
const homeReads = (fixture) => fixture.state.readQueries.filter(isHomeQuery);
const documentHtml = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

export function prepareHomeBuildFailure(fixture) {
  fixture.state.fail = true;
  fixture.state.headerDelayMs = 3100;
  fixture.state.failRequest = (url) => isHomeQuery({
    table: url.pathname.split("/").at(-1),
    limit: url.searchParams.get("limit"),
  });
  fixture.state.starterTracks = [{
    id: "50000000-1234-4000-8000-000000000001",
    provider: "deezer",
    provider_id: "4201",
    type: "track",
    title: "Home recovery starter",
    artist_name: "Fixture artist",
    cover_url: null,
    deezer_url: null,
    prompt: null,
    editorial_note: null,
    is_featured: true,
    sort_order: 0,
    created_at: "2026-10-25T00:00:00Z",
  }];
}

export function assertHomeBuildIsolation(fixture, manifest) {
  assert.equal(homeReads(fixture).length, 0,
    "The build must not require public /home data while its origin is unavailable");
  const route = Object.entries(manifest.dynamicRoutes).find(
    ([pathname]) => /^\/home\/\[\[\.\.\.[^/]+\]\]$/.test(pathname),
  );
  assert.ok(route, "Public /home must retain an on-demand static route");
  assert.equal(route[1].fallback, null,
    "The first /home generation must block for complete public HTML");
}

export async function verifyHomeRuntimeRecovery(fixture, appUrl) {
  const results = [];
  const request = async (pathname) => {
    const response = await fetch(appUrl + pathname, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    return { response, html: await response.text() };
  };
  const assertContent = ({ response, html }) => {
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /\bs-maxage=300\b/,
      "The generated public page must keep its effective 300-second ISR policy");
    assert.ok(html.includes('rel="canonical" href="https://kocteau.com/"'));
    assert.ok(html.includes('id="home-page-structured-data"'));
    assert.ok(html.includes('id="home-structured-data"'));
    const document = documentHtml(html);
    assert.match(document, /<h1\b/);
    assert.ok(document.includes(fixture.reviews[0].title),
      "Public reviews must be in server HTML, not only a script payload");
    assert.ok(document.includes("Home recovery starter"),
      "A failed build or first fill must not pin an empty Starter section");
  };
  try {
    const before = homeReads(fixture).length;
    const failureStartedAt = performance.now();
    const failed = await request("/home");
    const attempts = homeReads(fixture).slice(before);
    assert.ok(attempts.some(({ table }) => table === "reviews"),
      "The first runtime generation must actually exercise the unavailable review origin");
    assert.notEqual(failed.response.headers.get("x-nextjs-cache"), "HIT",
      "A failed first generation must not become a reusable successful page");
    assert.ok(!documentHtml(failed.html).includes(fixture.reviews[0].title));
    results.push({
      journey: "home-first-generation-failure",
      http: failed.response.status,
      homeReads: attempts.length,
      contentWaitMs: Math.round(performance.now() - failureStartedAt),
      cachedHit: false,
    });

    fixture.state.fail = false;
    fixture.state.headerDelayMs = 80;
    const recovered = await request("/home");
    assertContent(recovered);
    assert.equal(recovered.response.headers.get("x-nextjs-cache"), "MISS");
    results.push({ journey: "home-runtime-recovery", cache: "MISS", isrSeconds: 300, serverContent: true });

    // The public root is a rewrite, not a redirect or a separate private render.
    const root = await request("/");
    assert.equal(root.response.status, 200);
    assert.equal(root.response.headers.get("location"), null);
    assert.ok(root.html.includes('rel="canonical" href="https://kocteau.com/"'));
    assert.ok(documentHtml(root.html).includes(fixture.reviews[0].title));
    results.push({ journey: "guest-root-canonical", status: 200, redirect: false, canonical: "/" });

    fixture.state.fail = true;
    fixture.state.headerDelayMs = 3100;
    const readsBeforeHit = fixture.state.reads;
    const cached = await request("/home");
    assertContent(cached);
    assert.equal(cached.response.headers.get("x-nextjs-cache"), "HIT");
    assert.equal(fixture.state.reads, readsBeforeHit,
      "A repeated public page must reuse the good ISR page during an origin outage");
    results.push({ journey: "home-cached-during-outage", cache: "HIT", originReads: 0 });

    for (const pathname of ["/home/unexpected", "/home/unexpected/nested"]) {
      const readsBeforeMissing = fixture.state.reads;
      const missing = await request(pathname);
      assert.equal(missing.response.status, 404);
      assert.match(missing.html, /<meta\b[^>]*name="robots"[^>]*content="noindex/);
      assert.equal(fixture.state.reads, readsBeforeMissing,
        "Rejected /home suffixes must not start public data reads");
      results.push({ journey: "home-extra-path", pathname, status: 404, originReads: 0 });
    }
    return results;
  } finally {
    fixture.state.fail = false;
    fixture.state.failRequest = null;
    fixture.state.headerDelayMs = 80;
    fixture.state.starterTracks = [];
  }
}
