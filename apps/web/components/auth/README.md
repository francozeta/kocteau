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
finish profile/taste setup, and confirm the signed-in redirect to `/feed`.
Check invalid/expired codes, paste, keyboard focus, and mobile input.
For taste scroll indicators, also check resize/rotation, content reflow at the
same tag count, short/long/empty lists, and both scroll endpoints. Fades must
disappear when content fits without changing selection or the existing layout.
Return paths must stay on the same origin after browser URL normalization;
reject backslashes, control characters, and protocol-relative destinations.
