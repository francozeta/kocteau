# Reviews

## Entry Points

- Creation: `new-review-dialog.tsx`, `new-review-form.tsx`; editing: `edit-review-dialog.tsx`.
- Reading: `review-card.tsx`, `review-route-cards-server.tsx`.
- Actions/comments: `review-card-interaction-bar.tsx`, `review-comments-panel.tsx`.
- APIs: `app/api/reviews`; query state: `queries/reviews.ts`, `hooks/use-review-*`.

## Preserve

Track identity, reviewer, rating, and take come before engagement. Rating-only
reviews remain valid. Writes authorize in the route/RPC and retain RLS. Preserve
draft recovery and optimistic rollback. See [the product loop](../../../../PRODUCT.md).

## Check

Run tests, lint, and the web build. Exercise create/edit, draft recovery, like,
bookmark, comments, signed-out prompts, and failure rollback. Check desktop/mobile,
keyboard focus, long text, and rating-only cards.
