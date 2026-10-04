# Kocteau Documentation

Read [AGENTS.md](../AGENTS.md) and [CURRENT.md](../CURRENT.md) before working.
Then open the guide for the area you are changing.

The same sources build the public `/docs` route. Run `pnpm dev` to preview it.
Use [documentation maintenance](./documentation.md) for publishing and indexing.

## Contracts

| Document | Owns |
| --- | --- |
| [Working rules](../AGENTS.md) | Ownership, branches, changes, and verification |
| [Product](../PRODUCT.md) | Review/discovery loop, scope, and deferred work |
| [Design](../DESIGN.md) | Visual, interaction, and motion decisions |
| [Current state](../CURRENT.md) | Integrated work, review status, caveats, and next priority |
| [Contributing](../CONTRIBUTING.md) | Contribution and pull request workflow |

## Development And Implementation

| Guide | Owns |
| --- | --- |
| [Local development](./setup/local-development.md) | Fresh setup, returning devices, runtime, and checks |
| [Architecture](./core-architecture.md) | Code map, request/data boundaries, and reduction rules |
| [Components](./components.md) | Product directories and flow entry points |
| [Working context](./working-context.md) | Durable decisions and contributor/device handoffs |
| [Environment](./security/environment.md) | Variables, credentials, and environment separation |
| [Catalog research](./knowledge-layer.md) | Music identity, source evidence, and Studio proposals |
| [Discovery and curation](./discovery-curation.md) | Recommendation surfaces and analytics signals |
| [Contribution backlog](./backlog.md) | Contribution areas; individual tasks stay in issues |

## Operations

| Guide | Owns |
| --- | --- |
| [Operations](./operations.md) | External configuration, rollout, and smoke checks |
| [Supabase](./maintainers/supabase-workflow.md) | Versioned cloud migrations and authorization |
| [Releases](./maintainers/release.md) | Versions, changelog, and release review |
| [GitHub](./maintainers/github-rules.md) | Repository settings and protections |
| [Load readiness](./load-readiness.md) | k6 profiles, thresholds, and rollback criteria |
| [Apple Music imports](./maintainers/apple-music-import.md) | Maintainer source imports and rotation |
| [Email templates](../apps/web/emails/README.md) | OTP email source and preview |
| [Documentation](./documentation.md) | Source catalog, preview, link checks, and public indexing |

[Project skills](../.agents/README.md) travel with the clone.
[Shared plans](../.plan/README.md) hold useful handoffs until their outcomes enter
the contracts. Private scratch stays in ignored `.plan/local/` or `.codex-private/`.

Each fact has one owning document. Update it when behavior changes and link to it
elsewhere. Keep delivery status in CURRENT.md and issue/PR evidence; do not create
a second roadmap or copy setup instructions into several guides.
