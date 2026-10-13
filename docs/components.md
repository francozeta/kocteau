# Components

Product components live in `apps/web/components/<flow>`. Import the file directly:

```tsx
import ReviewCard from "@/components/reviews/review-card";
```

## Find A Flow

| Directory | Start here |
| --- | --- |
| [auth](../apps/web/components/auth/README.md) | OTP, profile onboarding, taste onboarding |
| [feed](../apps/web/components/feed/README.md) | For You, feed views, starter shelves, editorial rail |
| [discovery](../apps/web/components/discovery/README.md) | Search, canvas navigation, catalog selection |
| [reviews](../apps/web/components/reviews/README.md) | Composer, cards, comments, likes, bookmarks |
| [music](../apps/web/components/music/README.md) | Track/album/artist pages, covers, reusable music tiles |
| [profile](../apps/web/components/profile/README.md) | Listener profile, avatars, follows, curator application |
| [library](../apps/web/components/library/README.md) | Saved music and bookmarked reviews |
| [notifications](../apps/web/components/notifications/README.md) | Inbox, unread state, read actions |
| [settings](../apps/web/components/settings/README.md) | Account settings composition |
| [studio](../apps/web/components/studio/README.md) | Curator research, proposals, catalog editing, health |
| [shell](../apps/web/components/shell/README.md) | Navigation, route headers, responsive shell, shortcuts |
| [landing](../apps/web/components/landing/README.md) | Public landing and its visual assets |
| `help`, `docs` | Public help and contributor documentation |
| `ui` | shadcn primitives; aliases stay in `components.json` |
| `brand`, `icons` | Identity and icon exports used across flows |
| `shared` | Prefetch links, linked section headings, JSON-LD |

## Add Or Move A Component

1. Put it in the flow that owns its behavior. Keep supporting styles beside it.
2. Reuse `ui/` for primitives and import product files directly. Avoid barrel exports.
3. Preserve server/client boundaries and deferred imports when moving files.
4. Update consumers and the flow README if the entry point or behavior changes.
5. Run [the relevant checks](../CONTRIBUTING.md#verification).

A component can serve several flows without moving into `shared/`. A track tile
belongs to music even when Feed and Profile both use it. Extract shared code when
two concrete consumers need the same behavior.

Flow READMEs record code entry points, invariants, and checks. Decisions about the
product live in [PRODUCT.md](../PRODUCT.md); visual decisions in
[DESIGN.md](../DESIGN.md); delivery status in [CURRENT.md](../CURRENT.md).
