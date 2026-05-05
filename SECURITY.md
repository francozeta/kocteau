# Security Policy

Kocteau includes auth, Supabase data access, recommendation logic, and user-generated content. Please report security issues privately.

## Reporting a Vulnerability

Use GitHub private vulnerability reporting:

```text
https://github.com/francozeta/kocteau/security/advisories/new
```

If private reporting is unavailable, contact the repository owner before opening a public issue.

## Please Do Not

- Open public issues for exploitable auth, data, or permission bugs
- Exfiltrate, modify, or delete data
- Test against accounts or data you do not control
- Publish proof-of-concept exploit details before a fix is available

## Sensitive Areas

- Supabase schema, RLS, RPCs, and storage
- Auth, onboarding, sessions, and proxy behavior
- API routes that write data
- Recommendation and analytics data flows
- Environment and Sentry configuration
