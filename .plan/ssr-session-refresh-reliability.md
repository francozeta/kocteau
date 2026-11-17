# Session refresh reliability and new Supabase API key rules

Ref: official Supabase SSR guide (2026): https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&router=app ; API key guide: https://supabase.com/docs/guides/getting-started/api-keys ; library indexed as /supabase/ssr in Context7.

- App uses Next.js 16.3, @supabase/ssr ^0.12 and the correct createBrowserClient/createServerClient split; this is **not** a wholesale legacy-browser migration.
- Never present an Auth gateway 5xx / timeout as a signed-out user or redirect the authenticated root to public marketing. Return non-cacheable 503 with a retry hint for that root; preserve valid refresh cookies if already written. Invalid credentials still resolve to the anonymous landing.
- Since @supabase/ssr v0.10, setAll receives cache headers on refresh. Preserve them across changed responses; always mark refresh responses private, no-store. Never ISR-cache authenticated pages.
- Opaque sb_publishable keys belong in apikey, not Authorization: Bearer (the latter expects a JWT). Public HEAD/crawler existence checks must not send publishable keys as bearer tokens.
- Keep an overall proxy Auth-network budget so JWT key discovery/refresh cannot hang without limit. Timeout is not a successful anonymous verification.
- Server-verified claims and RLS remain mandatory for private content. Browser getSession() can adjust a CTA, but must never authorize access.
- QA: true authenticated /, anonymous /, expired-cookie /, transient Auth 503/504, token-refresh cookies/cache headers, public /home, server-rendered content and browser navigation; evaluate signed-in browser preview before shipping.
- This patch does not resolve upstream REST/Auth availability. Check live error rates, selected Vercel deployment and rollback; do not infer provider outage from general status badges.
