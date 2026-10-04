# Profile

## Entry Points

- Public profile composition: `profile-page-header.tsx`, `profile-recent-reviews-section.tsx`.
- Editing: `profile-editor-form.tsx`; avatar upload/crop components stay together.
- Follow action: `follow-profile-button.tsx`, `hooks/use-profile-follow.ts`.
- Reads/writes: `lib/queries/profiles.ts`, `app/api/profile`, `app/api/profiles/[profileId]/follow`.

## Preserve

Public profiles support taste discovery. Account actions require the appropriate
session. Official badges do not grant curator access. Storage permissions and
server/client boundaries follow [architecture](../../../../docs/core-architecture.md).

## Check

Run tests, lint, and the web build. Check owner/other-listener/signed-out states,
nullable onboarding usernames, follow rollback, avatar crop/upload, and mobile layout.
