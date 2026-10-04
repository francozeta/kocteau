# Settings

## Entry Points

- Routes: `app/(main)/settings`; shared frame: `settings-page-frame.tsx`.
- Profile editing reuses `components/profile/profile-editor-form.tsx`.

## Preserve

Keep route composition here and account behavior in the owning Profile/Auth flow.
Catalog integrations follow [product scope](../../../../PRODUCT.md).

## Check

Run lint and the web build. Check profile/music-link navigation, direct route
loading, signed-out access, mobile overflow, and keyboard focus.
