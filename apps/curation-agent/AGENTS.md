# Curation Agent Rules

This app is Kocteau's local Eve curation copilot.

- Read `node_modules/eve/docs/README.md` before changing Eve agent code.
- Never add production Supabase write credentials to this app.
- Keep generated curation packets and AI output under the repository `tmp/` directory.
- Eve suggestions are drafts only. A maintainer must review output and set `humanReviewed: true` before SQL generation.
- Do not add this app to the main web deploy path unless explicitly requested.
