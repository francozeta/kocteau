# Documentation

## Edit And Preview

Edit the source Markdown in the repository. `docs/meta.json` selects public pages
and owns their route, title, short description, group, and order.

```bash
pnpm docs:check
pnpm dev
```

Open `/docs`. The development process watches registered Markdown and regenerates
the documentation when it changes. Production builds compile the same sources.
Generated files under `apps/web/.generated/docs/` stay ignored.
The web configuration disables framework-generated working rules; the repository
[contract](../AGENTS.md) and flow READMEs own contributor context.

## Add A Guide

1. Write the durable guide beside its owning code or under `docs/`.
2. Use a short opening, then entry points, commands/examples, constraints, and checks.
3. Add a record to `docs/meta.json` and a link in [the repository index](./README.md).
4. Run `pnpm docs:check` and `pnpm --filter web build`.

Keep one canonical source per fact. Public pages exclude local plans, diagnostics,
environment files, and other private working state. Relative links to registered
guides become `/docs` links; source-code links open the repository.

## Indexing

Each page renders HTML without login and has a canonical URL, a description,
linked headings, and previous/next navigation. Public documentation routes appear
in `sitemap.xml`; crawler rules allow documentation while retaining the existing
restrictions on private/product routes.

- `/docs/llms.txt`: grouped links and descriptions from the same catalog.
- `/docs/<slug>/raw`: the source page as Markdown.
- `/llms.txt`: the product index also links to contributor documentation.

These support discovery after publication. A local build does not prove deployment
or inclusion in a search engine's index.

## References

The structure follows shadcn's practical [component reference](https://ui.shadcn.com/docs/components/button),
[ordered catalog](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/meta.json),
and [text index](https://ui.shadcn.com/llms.txt). Kocteau uses its existing Next.js
application and Markdown sources for delivery.
