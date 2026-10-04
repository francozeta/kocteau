# Studio

## Entry Points

- Editor: `starter-studio-client.tsx`; research: `starter-catalog-research.tsx`.
- Optional context: `starter-editorial-proposal.tsx` and its adjacent CSS module.
- APIs: `app/api/starter/research`, `app/api/starter/proposals`.
- Domain: `lib/catalog/research.ts`, `lib/catalog/signal-proposals.ts`, `lib/curation`.

## Preserve

Private curator/admin roles authorize every privileged action. Research and
proposals leave saved/manual choices intact; publication uses the normal save
boundary. Queue, evidence, and budget rules live in
[catalog research](../../../../docs/knowledge-layer.md).

## Check

Run tests, lint, and the web build. Follow [Studio rollout checks](../../../../docs/operations.md#studio-research-rollout)
for permissions, retries, stale context, preserved manual edits, cron recovery,
and the desktop dialog/mobile drawer. Consult CURRENT.md before schema work.
