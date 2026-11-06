# Kocteau API

Kocteau is a music review and discovery app. This guide describes **existing read-only public HTTP endpoints**, not an agent account or a general-purpose publishing API. Browsers and anonymous agents can use these endpoints without a login; personal actions in Kocteau still require a user session.

- [OpenAPI 3.1 specification](https://kocteau.com/openapi.json)
- [Site index for agents](https://kocteau.com/llms.txt)
- [Public music reviews](https://kocteau.com/reviews)
- [Source repository](https://github.com/francozeta/kocteau)

## When to use this API

Use `GET /api/search` to find music catalog candidates by track, album, or artist name. Follow canonical review pages when you need human opinions; search results are metadata, not authored reviews. Use `GET /api/feed` to read recent public reviews without a session. Prefer quoting or linking the actual review URL rather than treating a catalog search hit as an opinion.

This public contract does **not** provide a way for agents to create reviews, like posts, follow people, access private libraries, or log into another person's account. There is currently no official Kocteau MCP server, SDK, or CLI.

## Search public music

```http
GET https://kocteau.com/api/search?q=slowdive&type=track&source=all
Accept: application/json
```

Query parameters: `q` (optional, maximum 80 characters), `type` (`all`, `track`, `artist`, `album`) and `source` (`all`, `local`, `remote`). The endpoint returns an array of catalog candidates. An empty query returns `[]`. Catalog availability may depend on external music providers, and a provider failure with no fallback can return `502`.

## Read recent public reviews

```http
GET https://kocteau.com/api/feed?view=latest
Accept: application/json
```

The JSON response contains `feed`, `activeUsers`, `nextCursor`, `view` and `requiresAuth`. Anonymous users receive a public feed. Personalized feed views require an authenticated user and should not be assumed public.

## Structured errors

The documented public endpoints use JSON errors with a stable `code`, a readable `message`, an actionable `hint`, and the existing backwards-compatible `error` string. Validation errors may additionally include `fieldErrors` and `formErrors`.

```json
{
  "error": "Please review the highlighted fields.",
  "code": "VALIDATION_ERROR",
  "message": "Please review the highlighted fields.",
  "hint": "Review the invalid query or field values and retry."
}
```

A missing API route returns `404` with `API_ROUTE_NOT_FOUND`; public catalog upstream failures may return `502` and a transient feed failure `503`. Do not retry invalid parameters without correcting them.

## HTML, Markdown, and crawlable pages

The homepage at `/` serves HTML to browsers and a Markdown product overview when the request prefers `Accept: text/markdown`. The Markdown response sets `Content-Type: text/markdown` and `Vary: Accept`. Unknown top-level paths requested as Markdown return a Markdown `404`; normal HTML routing keeps the existing not-found experience.

The human-readable [documentation](https://kocteau.com/docs) has canonical [Markdown sources](https://kocteau.com/docs/llms.txt). Also review [sitemap.xml](https://kocteau.com/sitemap.xml) and [robots.txt](https://kocteau.com/robots.txt). Public reviews, entity pages, and profiles are better citations than search JSON. Kocteau's public API may evolve; do not rely on undocumented internal routes.
