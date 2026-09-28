# Contribution Backlog

[Docs index](./README.md) | [Contributing](../CONTRIBUTING.md) | [Current state](../CURRENT.md)

Use [GitHub issues](https://github.com/francozeta/kocteau/issues) to coordinate
work before starting. This page lists contribution areas, not a duplicate issue
tracker. Check CURRENT.md and the implementation before treating an idea as missing.

## Focused Contributions

- Reproduce and fix keyboard, focus, or mobile overflow issues in review, search,
  and Studio flows. Include the failing interaction and viewport in the issue.
- Improve sparse-data, loading, and error states using real product behavior.
- Clarify setup instructions that fail on a clean local installation.
- Add regression coverage for catalog identity mapping, source failures, candidate
  scoring, and analytics payload validation when there is a concrete gap.
- Refine music-native copy while preserving the [design contract](../DESIGN.md).

## Maintainer Coordination

Discuss auth/onboarding, RLS, migrations, recommendation RPCs, analytics schema,
curator roles, and editorial approval before changing their contracts. The current
catalog-to-curation boundary is documented in [Catalog research](./knowledge-layer.md).
Recommendation events are defined in [Discovery and curation](./discovery-curation.md).

## Before Opening A Pull Request

Follow [CONTRIBUTING.md](../CONTRIBUTING.md), keep the change focused, explain the
user-visible result, and report proportional verification. UI changes need desktop
and mobile evidence; data or permission changes need relevant regression checks.

## Scope

[PRODUCT.md](../PRODUCT.md) defines what is deferred. New providers, vector search,
creator roles, and larger recommendation experiments need a demonstrated product
need and a separate discussion. Local execution plans are not community commitments.
