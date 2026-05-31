# RLS Tests

Add Supabase RLS and permission tests here when schema changes touch auth, storage, public reads, or write-sensitive RPCs.

Fresh setup verification currently relies on:

```bash
pnpm supabase:reset
pnpm supabase:lint
```
