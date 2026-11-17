# Auth outage and SSR cache integrity

This stage follows [Supabase SSR client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client) and Next.js Proxy guidance (checked 2026-11-17 using Context7 for `@supabase/ssr@0.12.0` and Next.js 16.3):

- Browser `createBrowserClient` remains supported; it is **not** a legacy browser auth helper. `getSession()` is acceptable for client-only UI state, but **not** for server authorization. `getClaims()` remains the server authorization method.
- Auth `getClaims()` error 5xx/429/transport is not an anonymous session. At authenticated root with an existing session cookie, render a private no-store, retryable 503 page instead of serving the public landing. Known invalid or missing sessions still reach the public landing. Never grant access to a user whose claims are unverified.
- Both request and response must receive refreshed cookies. `setAll(cookiesToSet, headers)` provides cache headers; these and cookies must also be copied to any rewritten response. Never cache a response with `Set-Cookie`.
- The server `getCurrentUserId` must distinguish an Auth outage from no valid session, so it cannot trigger a misleading guest redirect. Route errors remain recoverable.
- Public root `/` remains the SEO canonical for visitors; the private Feed remains noindex. No SQL or authentication policy/RLS changes.

## Validation

- Unit tests for valid, missing, expired, 429, network and 503/504 claims outcomes.
- Preview WebKit should exercise authenticated root during unavailable Auth, then normal access after recovery, and ensure no private cache leakage. The existing real-data test does **not** inject these failures unless augmented.
- Verify all GitHub checks, preview deployment, response headers and real production behavior before merge. Production origin availability is tracked separately in #263.
