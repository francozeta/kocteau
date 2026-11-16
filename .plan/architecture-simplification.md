# Canonical URLs and discovery reliability

Baseline: main `37138e7`. Local implementation only; no push, merge, production
deployment or cloud database migration is part of this work.

## Stages

1. Canonical public URLs use `/tracks/{slug}-{id}`, `/albums/{slug}-{id}`,
   `/artists/{slug}-{id}` and `/reviews/{slug}-{id}`. Profiles retain
   `/u/{username}`. The trailing twelve-character ID resolves identity; labels
   describe it. Former canonical and singular routes remain compatibility
   entries. Resolve directly to the final canonical URL, preserving functional
   review query parameters. Search's shared seed routes remain independent.
2. Performance checks target `/home` and `/?view=for-you`, assert meaningful
   content and verify compatibility redirects outside latency metrics. Starter
   publication/archive expires its shared data tag. Browser Query state is
   isolated when account identity changes.
3. Discovery transports stable artist IDs through retrieval and ranking, with
   explicit legacy-memory compatibility. Search preserves source readiness and
   explicit partial recovery. Starter taste aggregation is independent of the
   number of editorial collection memberships.
4. Search retrieval and MMR evaluation remain separate experiments until their
   result quality, SQL plans, failure behavior and runtime costs are reviewed.
   No Rust, embeddings or additional service is introduced.

## URL rollout contract

All internal links, canonical metadata, Open Graph, JSON-LD and sitemap use the
central route helpers. Legacy UUID, twelve-character and unambiguous
eight-character aliases must resolve the same resource. Ambiguity and genuine
absence remain distinct from temporary read failures. Wrong or outdated labels
canonicalize to the current title. A legacy lookup performs no viewer-state
read before redirection. Keep compatibility routes indefinitely for shared links.
Legacy Route Handlers return actual HTTP 308 before rendering; transient lookup
failures return uncached 503 with Retry-After rather than a false 404. Current
page labels may canonicalize through Next's streamed permanent redirect after
headers have been sent; canonical metadata still names the final document.

Preview gates: unit tests, lint/build, canonical and legacy browser navigation,
HTTP redirects, canonical metadata/sitemap, guest/authenticated state, Back,
query-driven review actions and origin failure/retry. The journey fixture uses
loopback synthetic data and local telemetry; it never requires cloud credentials.
Chromium can be selected with `JOURNEY_BROWSER=chromium`; WebKit remains default.
The fixture is functional evidence, not production latency or physical-device
coverage. Review any differences against open SEO PRs #306/#307 before publishing.

Schema delivery must follow the existing Supabase workflow. SQL tested on a
disposable local instance is not a commercial migration; apply reviewed database
changes before deploying code that requires them. Missing remote delivery must
remain explicit in the handoff. MMR has no product import or runtime toggle.

## Verification record

Record actual stage commits, commands, results and remaining environment limits
in CURRENT.md at handoff. Keep raw reports and machine-specific diagnostics
ignored. Do not use synthetic rankings or a faster kernel as evidence of improved
recommendation quality; human judgments are a separate gate.
