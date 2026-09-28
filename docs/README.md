# Kocteau Documentation

Start with the [repository README](../README.md), [product](../PRODUCT.md),
[design](../DESIGN.md), and [current state](../CURRENT.md). These are the main
contracts; the guides below cover specific contributor and maintainer needs.

## Product And Implementation

- [Core architecture](./core-architecture.md): product boundaries and reduction rules.
- [Catalog research and curation](./knowledge-layer.md): music identity, source evidence, editorial decisions, and Studio integration.
- [Discovery and curation](./discovery-curation.md): recommendation surfaces and the analytics signal contract.
- [Contribution backlog](./backlog.md): focused contribution areas and sensitive-system boundaries. Use GitHub issues to coordinate individual tasks.

## Setup And Operations

- [Local development](./setup/local-development.md): local-first Supabase setup.
- [Environment and secrets](./security/environment.md): local, staging, and production configuration.
- [Operations](./operations.md): rollouts, smoke checks, catalog research, and recommendation health.
- [Load readiness](./load-readiness.md): k6 profiles, latency thresholds, and rollback criteria.

## Maintainer Workflows

- [Supabase](./maintainers/supabase-workflow.md): versioned cloud migrations and contributor boundaries.
- [Release automation](./maintainers/release.md): release flow and smoke checks.
- [GitHub rules](./maintainers/github-rules.md): protections, labels, and Actions permissions.
- [Apple Music imports](./maintainers/apple-music-import.md): editorial source imports and rotation.

Device-local phases and plans belong in the ignored root `.plan/` directory.
They are not required reading for contributors; published status stays in CURRENT.md.
