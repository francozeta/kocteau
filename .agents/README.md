# Project Skills

These checked-in instructions and reference files travel with a normal clone.
`../skills-lock.json` records the installer provenance (source repository, source
path, and recorded upstream hash). Read `../AGENTS.md` and `../CURRENT.md` first;
skills do not override Kocteau's product decisions or authorize unrelated changes.

Load only the skills relevant to the task, then follow their referenced guidance.

| Work | Starting points |
| --- | --- |
| Interface craft | `better-ui`, `better-layout`, `better-typography`, `better-colors` |
| Interaction and copy | `better-accessibility`, `better-writing` |
| Motion | `transitions-dev`, `transitions-polish` |
| Existing interface review | `better-interface`, `interface-review`, `explain-interface` |
| React and Next.js | `vercel-react-best-practices` |
| Supabase and SQL | `supabase`, `supabase-postgres-best-practices` |
| Metadata and search visibility | `seo-audit`, `ai-seo`, `programmatic-seo`, `seo-geo`, `firecrawl-seo-audit` |
| Backend agent work | `eve`, only when that runtime is actually in scope |

Other installed references remain available for targeted tasks. The Eve skill's
entry point is included with its license/notice; its unrelated framework checkout
is excluded. Runtime documentation comes from the installed `eve` package if the
project adopts it. Bundling a skill does not install or configure a service.

## Provenance And Maintenance

Preserve upstream attribution and license notices. Available repository licenses
are included under `licenses/`; Eve retains its own `LICENSE` and `NOTICE`.
The React skill declares MIT in its frontmatter. The installed transition and
OKLCH references did not include a standalone license file; consult their upstream
terms before redistributing them outside this project. Do not assume Kocteau's
license replaces an upstream work's terms.

Review updates like code, including referenced scripts. Commit intentional skill
changes with the lockfile when updating through the installer; do not rewrite
the recorded upstream hashes to imply that local adaptations are upstream releases.
Never commit personal tool configuration, credentials, sessions, or provider keys.
