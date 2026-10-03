<p align="center">
  <img src="./apps/web/public/logo.svg" width="88" alt="Kocteau logo" />
</p>

<h1 align="center">Kocteau</h1>

<p align="center">
  Music reviews by real listeners. Human taste, quiet discovery, and editorial starter picks.
</p>

<p align="center">
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-f5f5f5?style=flat-square&labelColor=111111" /></a>
  <a href="https://nextjs.org"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" /></a>
  <a href="https://supabase.com"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=flat-square&logo=supabase&logoColor=white&labelColor=111111" /></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-typed-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=111111" />
  <a href="https://github.com/francozeta/kocteau/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/francozeta/kocteau?style=flat-square&label=contributors&labelColor=111111&color=f5f5f5" /></a>
  <a href="https://github.com/francozeta/kocteau/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22"><img alt="Good first issues" src="https://img.shields.io/github/issues/francozeta/kocteau/good%20first%20issue?style=flat-square&label=good%20first%20issues&labelColor=111111&color=f5f5f5" /></a>
</p>

<p align="center">
  <a href="https://kocteau.com">Website</a>
  ·
  <a href="./CONTRIBUTING.md">Contributing</a>
  ·
  <a href="./docs/backlog.md">Backlog</a>
  ·
  <a href="https://github.com/francozeta/kocteau/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22">Good first issues</a>
  ·
  <a href="./docs/README.md">Docs</a>
</p>

<p align="center">
  <img src="./docs/assets/kocteau-production-readme-preview.png" alt="Kocteau production preview: feed, reviews, and discovery rail" width="100%" />
</p>

Kocteau is an open-source music review and taste discovery app. The current product loop is simple: enter with email OTP, complete a profile, choose initial taste signals, review music, and discover new reviews through a personalized For You feed.

## Start Here

| Need | Read |
| --- | --- |
| Work on this repository | [AGENTS.md](./AGENTS.md), then [CURRENT.md](./CURRENT.md) |
| Understand the product and interface | [PRODUCT.md](./PRODUCT.md) and [DESIGN.md](./DESIGN.md) |
| Run or resume the project on another machine | [Local development](./docs/setup/local-development.md) |
| Find the code and data boundaries | [Architecture](./docs/core-architecture.md) |
| Contribute a focused change | [CONTRIBUTING.md](./CONTRIBUTING.md) and [backlog](./docs/backlog.md) |
| Find a technical or operational guide | [Documentation index](./docs/README.md) |

## Product And Stack

The web app includes email OTP, profile and taste onboarding, track reviews,
likes, bookmarks, comments, follows, a personalized For You feed, Search discovery,
and editorial starter picks. `/` is the public landing; signed-in listeners reach
For You at `/feed`. Curators research and manage picks in Studio through private
roles. [CURRENT.md](./CURRENT.md) distinguishes integrated behavior from review work
and remaining verification.

Next.js App Router, React, TypeScript, Tailwind/shadcn, TanStack Query, and Supabase
Auth/Postgres/Storage form the existing stack. Deezer supplies music identity;
MusicBrainz supports catalog research. See [architecture](./docs/core-architecture.md)
for the implementation map.

## Development

Use the Node version in [`.node-version`](./.node-version) and the pnpm version in
[`package.json`](./package.json). Contributors use Docker-backed local Supabase.

```bash
pnpm install --frozen-lockfile
```

Follow [local development](./docs/setup/local-development.md) to configure the
environment, initialize local data, and start `pnpm dev:web`. An existing checkout
should follow the returning-device steps before changing branches or resetting data.

```bash
pnpm check
git diff --check
```

`pnpm check` runs unit tests, workspace lint, and the web build with TypeScript
validation. Database and authenticated flows need their own verification.

## Contributing And Operations

Start with [good first issues](https://github.com/francozeta/kocteau/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22),
[help wanted](https://github.com/francozeta/kocteau/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22help%20wanted%22),
or the [backlog](./docs/backlog.md). Use conventional branches and commits as
defined in [AGENTS.md](./AGENTS.md). Release Please proposes versions and changelogs;
maintainers control publication and merge.

Environment variables belong to [the environment guide](./docs/security/environment.md).
Cloud migrations use [the Supabase workflow](./docs/maintainers/supabase-workflow.md);
rollout and smoke checks live in [operations](./docs/operations.md). Project skills
and their references travel with the clone through [.agents](./.agents/README.md).
