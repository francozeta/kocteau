# Kocteau Email Templates

Minimal dark transactional emails for Kocteau. These are React components that
can be previewed with React Email and sent with Resend. The OTP HTML version can
also be pasted into Supabase Auth email templates.

## Preview

```bash
pnpm --filter web email:dev
```

React Email runs on port `3001` so it does not collide with the Next.js app.

## OTP Email

- Subject: `Your Kocteau sign-in code`
- Preheader: `Use {{otpCode}} to continue to Kocteau.`
- Primary text: a short code-only login message.
- CTA: none. The OTP email should only expose the code.
- Variables:
  - `userName`
  - `otpCode`
  - `logoUrl`
  - `expiresInMinutes`

For Supabase Auth SMTP, use `supabase-otp-template.html` and keep the code
placeholder as `{{ .Token }}`. Since Kocteau verifies the code inside the app,
do not include a button back to `/login`; it creates a confusing loop.

Short version:

```text
Your Kocteau code is {{otpCode}}. It expires soon.
```

## Welcome Email

- Subject: `Welcome to Kocteau`
- Preheader: `Your profile is ready. Start shaping your music graph.`
- Primary text: warm, brief welcome to the social music layer.
- CTA: `Open Kocteau`
- Variables:
  - `userName`
  - `appUrl`
  - `logoUrl`

Short version:

```text
Welcome to Kocteau. Review music, save references, and follow people whose taste you trust.
```

## Visual System

- Background: `#070707`
- Panel: `#0d0d0d`
- Elevated field/code block: `#141414`
- Primary text: `#f7f4ee`
- Secondary text: `#b8b4ad`
- Muted text: `#7d7d7d`
- Border: `#262626`
- CTA background: `#f4f1ea`
- CTA text: `#090909`
- Accent is intentionally restrained; the OTP code carries the emphasis.

Spacing:

- Email canvas padding: `32px 16px`
- Panel padding: `34px 28px`
- Section rhythm: `18px`, `28px`
- Button padding: `13px 18px`
- Radius: `12px` for CTA, `18px` for code, `24px` for panel

Typography:

- System UI stack for broad email-client support.
- Monospace stack only for OTP code.
- No external web fonts; Gmail and Outlook are more predictable this way.

Logo:

- Use `https://kocteau.com/logo-k.png` in production emails.
- Avoid `logo.svg` in email bodies. SVG support is inconsistent in Outlook and
  several Gmail rendering paths. Keep SVG for the app UI and use PNG for email.
- Do not round the logo in email CSS. Use the exported PNG shape as-is.
