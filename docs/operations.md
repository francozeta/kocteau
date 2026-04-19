# Kocteau Operations

This file captures the production setup that lives outside the codebase.

## Supabase Auth

Kocteau is OTP-first.

Recommended settings:

- Keep email confirmation enabled.
- Use Supabase Auth for OTP generation and verification.
- Do not create a custom OTP table unless Supabase Auth becomes insufficient.
- Keep profile creation/onboarding separate from auth creation.

Current app behavior:

- `/login` and `/signup` both use `signInWithOtp`.
- New emails are allowed through `shouldCreateUser: true`.
- The app verifies codes with `verifyOtp({ type: "email" })`.
- After verification, users are routed through profile onboarding, taste onboarding, or `/`.

## Supabase Email Templates

Kocteau uses a code-only OTP email.

Template file:

- `apps/web/emails/supabase-otp-template.html`

Supabase dashboard location:

```text
Authentication -> Email Templates -> Magic Link
```

Use:

```text
{{ .Token }}
```

Avoid:

```text
{{ .ConfirmationURL }}
{{ .TokenHash }}
```

Those URL variables reintroduce magic-link behavior and can confuse users because Kocteau expects the code to be entered in-app.

The `Confirm Signup` template may also be kept code-only for consistency, but the current app flow primarily depends on the Magic Link template because it uses `signInWithOtp`.

## Resend SMTP

Supabase Auth sends emails through custom SMTP.

Typical Resend SMTP values:

```text
Host: smtp.resend.com
Port: 465 or 587
Username: resend
Password: Resend API key
Sender email: auth@kocteau.com
Sender name: Kocteau
```

The sender domain must be verified in Resend. Avoid using Vercel preview domains as email sender domains.

## SQL Scripts

Scripts live in:

```text
supabase/scripts
```

Current scripts:

- `wipe-demo-auth-data.sql`
- `recommendation-v2.sql`
- `analytics-events.sql`

Recommended production order for a fresh setup:

1. Base schema and auth/profile scripts
2. `recommendation-v2.sql`
3. `analytics-events.sql`
4. Supabase Auth email template updates
5. Application deploy

Run destructive scripts only after a backup and only when intentionally clearing demo/test data.

## Post-Deploy Checks

After deploying auth or recommendation changes:

1. Log out.
2. Request OTP on `/login`.
3. Confirm the email contains only a 6-digit code.
4. Verify the code.
5. Complete profile onboarding if needed.
6. Complete taste onboarding if needed.
7. Confirm `/` loads For You.
8. Like, bookmark, and open comments from For You.
9. Check Supabase for analytics events.

Useful analytics check:

```sql
select event_type, source, count(*)
from public.analytics_events
group by event_type, source
order by count(*) desc;
```

Useful recommendation health check:

```sql
select *
from public.get_recommended_review_ids(8, null, null, null);
```

Run that recommendation check as an authenticated user context when testing from the app; direct SQL editor calls may not have `auth.uid()`.

## Branching and Releases

Current preference:

- Avoid automatic versioning unless explicitly requested.
- Use branches for meaningful features.
- Let GitHub PRs, merges, tags, and releases be handled manually unless asked otherwise.

Good branch names:

- `auth-email-code-only`
- `recommendation-v2`
- `instrumentation-v0.1.3`
- `feature-name-short`
