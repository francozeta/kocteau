# Shared Plans

[Current state](../CURRENT.md) | [Working contract](../AGENTS.md) | [Docs](../docs/README.md)

Keep only useful cross-device phases, decisions, and implementation handoffs here.
Link the coordinating issue and PR; neither a plan nor a checked box proves delivery.
Promote durable decisions to their owning document and mark superseded plans historical.

[App audit and working context](./app-audit-continuity.md) records integrated defect
corrections and the remaining verification work. Studio coordination continues in
[issue #206](https://github.com/francozeta/kocteau/issues/206).

[Capacity and security audit](./capacity-security-audit.md) records the bounded
cloud measurement, data-plane incident and recovery, and prioritized follow-up.

Local experiments, diagnostics, screenshots, and private notes belong in ignored
`.plan/local/` or `.codex-private/`. They are not contributor documentation.

- [Public read reliability](./public-read-reliability.md): measured implementation following the capacity audit; merged in PR #221; cold-read reliability remains under investigation.

- [Scale readiness stages](./scale-readiness.md): cold reads, feed I/O, shared coordination and mixed-load verification; implementation in progress.

- [Search recovery](./search-recovery.md): typing amplification, recoverable errors and history/session continuity after the production incident.

- [Public read cache recovery](./public-read-cache-recovery.md): starter failure boundaries and render-scoped provider lookup reuse; isolated evidence and rollout limits.

- [Anonymous review recovery](./review-read-recovery.md): failed public list fills, explicit recovery and content-based guest verification under issue #240.

- [Primary rendering](./primary-render.md): staged home/feed delivery under #229, pinned dependency checks and latency limits.

- [Authenticated feed read bundle](./authenticated-feed-read-bundle.md): ranked cards and private viewer state in one authenticated read; current integration under #255.

- [Starter query work](./starter-query-work.md): narrow ranking rows, current SQL plans, payload comparisons and growth limits under #230.
