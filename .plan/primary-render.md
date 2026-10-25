# Home And Feed Primary Rendering

Coordination: [#147](https://github.com/francozeta/kocteau/issues/147) and
[#229](https://github.com/francozeta/kocteau/issues/229).
Baseline: main `35be7d9a71b46925dedcc4db7c332a31aa3cd914`, 25 Oct 2026.
This is the first home/feed stage; explicit-query Search remains in #229.

## Decision

The authenticated route starts one private editorial read beside its primary
reads and passes the same promise to the existing client surface. Review content
and viewer flags no longer wait for picks. Suspense is limited to the editorial
slots; responsive shelf skeletons preserve the successful loading geometry.
Optional empty/error fallback can remove a section without removing reviews.
The streamed starter card starts without an entrance animation, keeping its
server/client attributes consistent with reduced motion. Review ranking, SQL,
RLS, public caches, API contracts and PR #222 are unchanged.

The public landing uses independent server sections for its introduction,
decorative music examples and recent reviews. Review JSON-LD stays with the same
review data. Both starter-backed sections share one read. The 300-second ISR
policy remains intact; cached production HTML may already contain every section.

The research backlog is [#251](https://github.com/francozeta/kocteau/issues/251).
The issue form and working-context guide now capture existing behavior, references,
scope, priority and observable acceptance before future ideas become code.
Linear organizes the existing GitHub imports instead of creating duplicate work.

## Reproduction

From `apps/web`, with Playwright/WebKit installed:

```sh
node tests/load/verify-primary-render.mjs
PRIMARY_RENDER_BASELINE_REF=35be7d9a71b46925dedcc4db7c332a31aa3cd914 node tests/load/verify-primary-render.mjs
```

`KOCTEAU_PLAYWRIGHT_MODULE` can select an external Playwright installation;
`PLAYWRIGHT_BROWSERS_PATH` can select its installed browsers.

The disposable Next application loads the actual route and UI source, injecting
only synthetic auth/query boundaries. Baseline mode reads the pinned route and
landing component from Git; it does not merely disable assertions. All network
access is restricted to loopback and no repository environment file is loaded.
The public landing is deliberately dynamic only in this fixture so a held origin
response exposes render dependencies; it does not reproduce deployed ISR timing.

The comparison clears the previous document before holding a response, avoiding
a false success from content left on screen by a previous navigation. Waits have
deadlines and both the temporary application and process are removed afterward.

## Observed Results

WebKit at 390×844 and 1280×900:

| Observation | Pinned baseline | New implementation |
| --- | --- | --- |
| Ready review while editorial response is held | Absent | Present |
| Landing introduction before both reads finish | Absent | Present |
| Shared editorial origin calls per surface | 1 | 1 |
| Review displacement when successful picks arrive | Not applicable | 0 px |

The fixture also checks optional unavailable/empty picks, sparse feed content,
view navigation, anonymous feed redirect, browser errors and horizontal overflow.
The existing 190 tests passed. Final lint, docs, build and browser results belong
in CURRENT.md and the PR; do not infer delivery from this plan alone.

## Limits And Next Work

This is causal dependency evidence, not production P95, SQL execution time,
total-completion acceleration or concurrent-user capacity. It does not validate
Supabase Auth/RLS or a physical iPhone/TikTok session. No production load test,
schema migration or new service was introduced.

Next: #243 pagination failure budgets; #228/#242 cache consistency; reconcile the
PR #222 consumer; use representative current query plans in #230 before choosing
SQL changes. Search progress remains tracked by #229 rather than counted as done.
