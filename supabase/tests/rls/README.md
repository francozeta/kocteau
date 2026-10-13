# RLS Tests

This directory is reserved for dedicated RLS regressions; it currently contains
no executable suite. Existing source/Studio permission assertions live in
[database tests](../database).

Run the database tests against a disposable migrated local stack:

```bash
pnpm supabase:lint
pnpm exec supabase test db
```

Reset local data only when it can be discarded, following
[local development](../../../docs/setup/local-development.md). New schema work
must cover signed-out, owner, other-user, and denied-role access as applicable.
Unit tests and a web build do not verify these database permissions.
