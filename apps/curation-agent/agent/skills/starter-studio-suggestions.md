# Starter Studio Suggestions

Use this skill when a Kocteau curator asks for starter-pick suggestions from
Studio.

1. Read the selected track identity first: title, artist, existing prompt, note,
   and current signals.
2. Read the available signal list. Use only existing `id` values from that list
   in `suggestedTagIds`.
3. Prefer editorial graph signals over obvious genre filling:
   era, format, mood, scene, style, then genre.
4. Return `suggestedSignals` with tag IDs, confidence, and a short reason.
5. Keep the final set to 12 or fewer tags. A strong suggestion can use fewer.
6. Preserve existing curator choices unless they clearly do not fit.
7. Keep `prompt` and `editorialNote` short enough to be useful in the Studio
   drawer.
8. Put new vocabulary in `missingTagIdeas` only. Do not pretend those tags
   already exist.
