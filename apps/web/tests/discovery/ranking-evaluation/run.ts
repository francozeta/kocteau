import { performance } from "node:perf_hooks";
import { rankDiscoveryCandidates, seedKey } from "../../../lib/discovery/canvas.ts";
import { rankingFixtures } from "./fixtures.ts";
import { rankMmr, selectionProxies, type RankingFixture } from "./mmr.ts";

const variants = ["current", "relevance-only", "mmr-0.7", "mmr-0.4"] as const;
type Variant = typeof variants[number];

function rank(fixture: RankingFixture, variant: Variant) {
  if (variant === "current") {
    return rankDiscoveryCandidates(fixture.seed, [...fixture.candidates],
      [...fixture.memory], fixture.now, fixture.variation).slice(0, 6);
  }
  return rankMmr(fixture, { lambda: variant === "relevance-only" ? 1 : variant === "mmr-0.7" ? 0.7 : 0.4 });
}

const selections = rankingFixtures.flatMap((fixture) => variants.map((variant) => {
  const selected = rank(fixture, variant);
  return {
    fixture: fixture.id,
    variant,
    selected: selected.map((item) => seedKey(item.seed)),
    proxies: selectionProxies(fixture, selected),
  };
}));

if (process.argv.includes("--blind")) {
  const sheets = rankingFixtures.map((fixture, index) => {
    const order: Variant[] = index % 2 === 0
      ? ["current", "mmr-0.7"] : ["mmr-0.7", "current"];
    return {
      fixture: fixture.id,
      provenance: fixture.provenance,
      seed: fixture.seed.title,
      panels: order.map((variant, index) => ({
        panel: index === 0 ? "A" : "B",
        items: rank(fixture, variant).map((item) => ({
          key: seedKey(item.seed), title: item.seed.title,
          artist: item.seed.artist_name,
          tags: fixture.features[seedKey(item.seed)]?.tags ?? [],
        })),
      })),
    };
  });
  process.stdout.write(JSON.stringify({
    warning: "Synthetic fixtures test mechanics only. Musical-quality judging needs vetted public snapshots and listening context. Panel assignment is deterministic, not experimental randomization.",
    sheets,
  }, null, 2) + "\n");
} else {
  const warmup = 200;
  const batches = 20;
  const perBatch = 50;
  let sink = 0;
  const timingSamples = new Map<string, number[]>();
  for (const fixture of rankingFixtures) {
    for (const variant of variants) {
      for (let iteration = 0; iteration < warmup; iteration++) sink += rank(fixture, variant).length;
      timingSamples.set(`${fixture.id}:${variant}`, []);
    }
    // Rotate variant order to avoid assigning every cold/late batch to one method.
    for (let batch = 0; batch < batches; batch++) {
      for (let offset = 0; offset < variants.length; offset++) {
        const variant = variants[(batch + offset) % variants.length];
        const startedAt = performance.now();
        for (let iteration = 0; iteration < perBatch; iteration++) sink += rank(fixture, variant).length;
        timingSamples.get(`${fixture.id}:${variant}`)!.push((performance.now() - startedAt) / perBatch);
      }
    }
  }
  const runtime = [...timingSamples].map(([key, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return { key, medianBatchMeanMs: sorted[Math.floor(sorted.length / 2)],
      p95BatchMeanMs: sorted[Math.ceil(sorted.length * 0.95) - 1] };
  });
  process.stdout.write(JSON.stringify({
    fixtureVersion: 1,
    provenance: "synthetic",
    quality: {
      status: "not-evaluated",
      warning: "Proxies measure selection mechanics, not relevance, listening satisfaction or serendipity. Compare MMR with relevance-only to isolate its redundancy penalty; current also differs in lane/identity policy.",
      selections,
    },
    runtime: {
      node: process.version, warmup, batches, perBatch, sink,
      warning: "Local warm batch means, not individual-call P95, browser, network, production capacity or Rust comparison. Retrieval, rendering, module startup and JSON output are excluded.",
      samples: runtime,
    },
  }, null, 2) + "\n");
}
