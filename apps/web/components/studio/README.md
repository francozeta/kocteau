# Studio

## Entry Points

- Editor: `starter-studio-client.tsx`; research: `starter-catalog-research.tsx`.
- Optional context: `starter-editorial-proposal.tsx` and its adjacent CSS module.
- APIs: `app/api/starter/research`, `app/api/starter/proposals`.
- Domain: `lib/catalog/research.ts`, `lib/catalog/signal-proposals.ts`, `lib/curation`.
- Private preview experiment: `/studio/discovery-lab`,
  `discovery-ranking-lab.tsx` and `lib/discovery/{lab-access,lab-snapshot,mmr}.ts`.

## Preserve

Private curator/admin roles authorize every privileged action. Research and
proposals leave saved/manual choices intact; publication uses the normal save
boundary. Queue, evidence, and budget rules live in
[catalog research](../../../../docs/knowledge-layer.md).

Saving or archiving a Starter track immediately expires the shared
`starter-tracks` data tag used by public picks and local Search. Both `/home`
and the authenticated root are revalidated; failed mutations leave the valid
catalog cache intact.

The Discovery lab requires the same Starter curator role. It is available only
on Vercel previews, or in local development with `?local=1`; production returns
not found before auth or the Studio shell is evaluated. The route is outside the
Studio layout for that ordering, forces dynamic rendering and has `noindex`.
It is not linked in public navigation or included in the sitemap.

The lab searches real public tracks through `/api/search`, then captures a
single `/api/discovery/map?lane=full` response. Current, relevance control and
MMR share that pool, seed, variation, clock and empty memory. Partial pools,
failed retrieval, cancellation and retry remain visible. A failed replacement
keeps the previous snapshot labelled with its own seed. Changing MMR's weight
does not fetch a new pool. Snapshot export downloads public input and selections
locally; it never writes to the database, profile or listener memory. Album/tag
features are absent from live pools, so live MMR only measures artist redundancy.
This labelled comparison supports feedback, not a blinded quality evaluation.
Default Search, For You and approved rendering/animation stay unchanged.

## Check

Run tests, lint, and the web build. Follow [Studio rollout checks](../../../../docs/operations.md#studio-research-rollout)
for permissions, retries, stale context, preserved manual edits, cron recovery,
and the desktop dialog/mobile drawer. Consult CURRENT.md before schema work.

For lab mechanics and access guards, run from the repository root:

```sh
pnpm exec tsx --tsconfig apps/web/tsconfig.json --test apps/web/lib/discovery/lab-access.test.ts apps/web/lib/discovery/lab-snapshot.test.ts apps/web/tests/discovery/ranking-evaluation/mmr.test.ts
```

On a preview, verify signed-out login, non-curator denial, curator access, real
seed selection, same-pool comparison, partial/error retry and JSON export. On a
production build, verify the lab is unavailable even with `?local=1`. The
offline corpus, reproducible runner and musical-quality decision gates live in
[the ranking evaluation plan](../../../../.plan/discovery-ranking-evaluation.md).
