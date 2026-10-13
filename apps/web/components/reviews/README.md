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
