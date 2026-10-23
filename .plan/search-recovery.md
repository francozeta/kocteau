# Search recovery

Status: merged in PR #223; a read-only production smoke check passed after deployment of `578f59e`.

## Incident and scope

Production main `93baae3` logged eight local-source
`[search.catalog] failed with no fallback` errors between 12:31:30 and
12:33:00 UTC on 2026-10-23 (07:31:30–07:33 Lima), for query lengths
2, 3, 5, 6, 7, 11, 12 and 13. The observed sequence is consistent with typing,
but logs do not identify the user's browser or prove that all requests came from
one person. No referenced screenshot was available in this verification.

Source inspection found an 80 ms Canvas debounce, up to seven anonymous Data API
reads per broad local search, and automatic client retries. Production diagnostics
also showed queue waits near 900 ms and header waits; these do not establish SQL
execution time or the underlying platform cause. A 20.7 s elapsed header-time
timeout is recorded in private evidence; runtime scheduling can exceed timer
budgets. Keep investigating cold reads separately.

The empty-canvas message means no selected item and no starter nodes. It does not
establish a WebGL failure. An unchecked selection return could clear the input
before the canvas was ready; this is a code path identified by review, not a
reproduction of the original incident.

## Correction

- Use the shared 300 ms typing delay. Move query observers to the live input key
  immediately so abandoned local/remote HTTP requests cancel during the delay.
  Existing shared server fills keep their own deadline.
- Disable catalog-search automatic retries and window-focus refetches. Preserve
  partial and cached same-query results; do not offer another query's old matches.
- Show a manual Retry search action on a complete failure. A failure does not
  restart or replace the selected canvas.
- Persist query/scope in bounded account-scoped history/session snapshots. Back
  and refresh recover the matching location. Storage failure keeps history and
  in-memory navigation working.
- Close/clear search only after selection is accepted. Restored non-empty queries
  reopen results; explicit Close and New canvas retain their clearing behavior.

No schema, ranking, provider identity, authenticated-write, or renderer change.
The separate shared-read cooldown experiment stays unpublished while this
regression takes priority. The feed bundle remains in PR #222; its two database
migrations have already been delivered and verified through the pinned CLI.

## Verification

The initial isolated mobile Chromium baseline emitted 14 search HTTP requests
while typing Slowdive at 150 ms per letter; the candidate emitted two.
A complete failure used four requests in the baseline and two in the candidate.
These counts describe this fixture, not production-wide savings or user capacity.

The first browser run caught a restored-query overlay issue and led to deriving
result visibility from a recovered non-empty query. Final verification passes 182 web tests, lint, the production build and docs checks.
Mobile Chromium/WebKit and desktop Chromium pass typing, cancellation, failure/retry,
Back, document return, query reload and blocked-storage checks without page errors.
A disposable authenticated WebKit session also passes; complete canvas-session
equality survives document return. Verify run 529 passed on exact head `e372b816`; its preview deployed successfully.
Read-only preview probes returned 200/fresh for both sources and 15 remote artist
results. Production deployment of merge `578f59e` is ready. A guest mobile WebKit
session on kocteau.com received one local and one remote 200, selected Slowdive,
and restored the input on browser Back without page errors. This is a small
read-only smoke check, not a capacity measurement. Playwright WebKit is not a
physical iOS/TikTok test.

The [Discovery guide](../apps/web/components/discovery/README.md) owns the reusable
regression procedure. Raw browser captures and logs remain private.
