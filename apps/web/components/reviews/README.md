# Reviews

## Entry Points

- Creation: `new-review-dialog.tsx`, `new-review-form.tsx`; editing: `edit-review-dialog.tsx`.
- Session state: `review-composer-session.tsx`; responsive dialog/drawer: `review-composer-surface.tsx`.
- Reading: `review-card.tsx`, `review-route-cards-server.tsx`.
- Actions/comments: `review-card-interaction-bar.tsx`, `review-comments-panel.tsx`.
- APIs: `app/api/reviews`; query state: `queries/reviews.ts`, `hooks/use-review-*`.

## Preserve

Track identity, reviewer, rating, and take come before engagement. Rating-only
reviews remain valid. Writes authorize in the route/RPC and retain RLS. Preserve
draft recovery and optimistic rollback. See [the product loop](../../../../PRODUCT.md).
Guest drafts return to `/feed?compose=1&draft=review` after login/onboarding.
Read the saved draft before opening its session; returning to search restores
focus to the search input.
Storage denial or quota failure must retain the form and show its existing save
error; draft cleanup must not report a successful publication as failed.
Composer state lives above its responsive container. Resizing must retain the
query, selection, rating, text, errors, and pending submission; a fresh opening
or different initial review starts a new session. Both create and edit use this
boundary. The new-review shortcut and visible hints use `N`.
Inactive form steps are inert. Stars use one Tab stop, arrow/Home/End focus
navigation, whole-star keyboard activation, and explicit half-star labels.

## Check

Run tests, lint, and the web build. Exercise create/edit, draft recovery, like,
bookmark, comments, signed-out prompts, and failure rollback. Check desktop/mobile,
keyboard focus, long text, and rating-only cards.
Cross 768px while searching, writing, and submitting, then close/reopen and switch
the initial review. Confirm retained state, intentional resets, and modal focus.
Check URL-triggered composition before pressing a launcher key; `compose=1`
must load the deferred composer and read its initial selection or saved draft.

## Public read recovery

Public feed queries propagate origin errors out of their tagged cache. Failed
fills remain retryable and failed refreshes cannot replace valid lists with empty
results. A successful empty response remains cacheable. A namespace change retires
empty entries made by the earlier error path; tags and TTL are unchanged.

The public reviews route distinguishes successful emptiness from a read failure.
Reviews, feed and public-home error boundaries offer **Retry reviews**; retry
refreshes server data. Feed API failures return private, no-store HTTP 503, allowing
client query state to retain available data rather than accepting a false empty
success. Authentication and viewer state remain outside public caches.

Run `pnpm test` for the cache regression. The isolated browser verifier uses the
actual app with a loopback Data API and no production environment files.
See [reproduction and limits](../../../../.plan/review-read-recovery.md) for mobile
and desktop WebKit commands and [discovery setup](../discovery/README.md) for the
external Playwright installation. CI builds use an explicit placeholder-only
successful-empty fixture; production builds keep their actual data source.

Canonical review reads propagate failures to the same Retry boundary; successful
missing identities remain distinct. See [canonical recovery](../../../../.plan/canonical-read-recovery.md) for error policy and verification.


Canonical short-review reads hydrate the public author/entity in one origin query
and reuse a 60-second entry per normalized route ID. Errors throw rather than
becoming cached absence. Review creation, edits and deletion immediately expire
UUID and 8/12-ID aliases; likes/comments retain their existing revalidation
policy. Viewer state remains private. See [navigation reads](../../../../.plan/canonical-navigation.md)
for the invalidation contract and reproducible read-count checks.

The edit dialog loads its form when rendered while retaining SSR for query-driven
opening. Composer ownership and the existing reset on close/reopen remain intact.
[Editor loading](../../../../.plan/review-editor-loading.md) owns browser and script
size checks; passing unit tests alone does not establish faster navigation.
