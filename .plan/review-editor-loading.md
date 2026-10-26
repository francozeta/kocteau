# Review editor loading

[#269 / KOC-112](https://github.com/francozeta/kocteau/issues/269), delivery
[PR #270](https://github.com/francozeta/kocteau/pull/270).

## Why

#268 reduced canonical origin reads, but its bounded production comparison did not
show a perceptible improvement: review median 486 -> 468 ms, track 891 -> 876 ms,
with slower outliers. [Its rollout record](https://github.com/francozeta/kocteau/pull/268#issuecomment-6418785667)
owns those observations. Do not present fewer queries as proof of faster navigation.

The edit dialog eagerly imports NewReviewForm even on reading routes with a
closed editor. The create dialog already loads the form dynamically. Split the
edit form while retaining its existing SSR behavior for query-driven auto-open
and the composer session ownership. Closing and reopening resets unsaved edits
to original fields, as before. No session policy, optimistic UI, prefetch or SQL
change is included.

## Verification and resource handoff

The prototype passed 216 unit tests, lint and types. Its first browser extension
incorrectly expected drafts to survive closing; the existing session explicitly
resets them. The corrected test checks original fields, typing while open,
Escape/reopen reset and query auto-open on mobile/desktop simulated sessions.
Final validation is pending CI.

The managed environment failed to start. The persistent Vercel sandbox reached
its Hobby usage limit on 26 Oct; it cannot resume before the platform resets
quota on 1 Nov or the account changes plan. Do not change billing automatically.
Snapshot snap_wh24SreMMWvLEtVsTiCpyVZSQy8i preserves the local work and reports.

Native navigation CI uses Ubuntu 24.04, repository Node/pnpm and external
Playwright 1.64.1, matching the documented browser version. It uses loopback
Data/Auth/telemetry only and needs no application credentials. For a PR marked
[compare-editor-bytes], compare-editor-bytes.mjs swaps only the editor source
from the PR base, verifies the full browser flow, restores the candidate and
verifies again in the same worker. It rejects a dirty editor file and restores
the original source in finally. Both guest viewports must remove at least 10 KiB
of decoded script resources along the reading journey; editor behavior and
existing failure/retry checks must pass in both builds.

Native reports record browser-reported script resource body sizes. They are not
network transfer totals, RUM or capacity. The public journey tool records the same
sizes. The optional CI production observation cannot gate code correctness:
the public target can change independently, and a green workflow does not prove
that optional step succeeded. Confirm its outcome, deployment source and time
separately. Different CI workers have unknown placement; do not compare their
latencies with the gru1 baseline. Keep raw reports ignored.

The original two-context production script observation on a772ab1 reported
2,118,776 decoded bytes at the reviews list and 2,176,501–2,183,486 along the
track journey; encoded resource sizes were approximately 651–673 kB.
These are browser resource sizes, not guaranteed actual wire bytes.

## Remaining work

Complete CI and compare emitted/requested code before accepting this as a
navigation optimization. #261 retains primary/optional track dependencies,
#265 private fault waits, #267 React 419 attribution and #228 catalog invalidation.
No overall production navigation improvement has been demonstrated yet.
