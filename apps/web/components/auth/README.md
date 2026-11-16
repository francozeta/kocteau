# Auth And Onboarding

## Entry Points

- Routes: `app/(auth)/login`, `signup`, `onboarding`, `onboarding/taste`.
- Components in this directory own OTP input and onboarding forms.
- Server helpers: `lib/auth`; callback: `app/auth/callback/route.ts`.

## Preserve

Email OTP stays inside Kocteau. Profile setup precedes taste setup; usernames can
remain null until onboarding finishes. Follow [the auth contract](../../../../PRODUCT.md)
and [environment setup](../../../../docs/security/environment.md).

## Check

Run unit tests and the web build. With local Supabase, request and verify OTP,
finish profile/taste setup, and confirm the signed-in redirect to `/`.
Check invalid/expired codes, paste, keyboard focus, and mobile input.
Return paths must stay on the same origin after browser URL normalization;
reject backslashes, control characters, and protocol-relative destinations.

The Query provider is bound to the server viewer ID, including taste onboarding.
An identity change in this or another tab discards the old account's Query cache
and reloads server-rendered viewer data. Same-account token refresh does not
navigate. Review draft recovery remains in its existing browser storage and URL;
clearing Query state must not clear that storage.

An initial server/browser identity mismatch may reconcile the document once per
pair. If it persists, or session storage is unavailable, return to public `/home`
instead of repeatedly loading private viewer props. This marker is separate from
review drafts and is removed after both identities agree.

The isolated browser check uses the real Query provider with a simulated auth
source, without production credentials or database requests:

```bash
KOCTEAU_PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
  node apps/web/tests/load/verify-account-cache.mjs
```

Set `ACCOUNT_CACHE_BROWSER=webkit` to use WebKit. The check covers account
replacement, cross-tab sign-out, pending reads, hash/query preservation, draft
storage and bounded initial reconciliation; it does not verify OTP delivery.
