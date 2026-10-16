# Discovery

## Entry Points

- Route: `app/(main)/search/page.tsx`; surface: `discovery-map.tsx`.
- Interaction: `hooks/use-discovery-canvas.ts`, `hooks/use-kocteau-search.ts`.
- Mobile keyboard geometry: `hooks/use-mobile-search-viewport.ts`.
- State/navigation: `lib/discovery`; search ordering: `lib/search/kocteau-first.ts`.
- APIs: `app/api/search`, `app/api/discovery/map`.

## Preserve

Browsing works signed out; publishing requires auth. Keep the Kocteau ranking
boost, provider identity stable, and URL navigation recoverable. The music catalog and
source boundaries live in [catalog research](../../../../docs/knowledge-layer.md).
Keep mobile input focus in the initiating tap handler, preserve native close-button
clicks, and fit the search dock/results to the visual viewport without overriding pinch zoom.
Reserve scroll padding so automatically scrolled results stay clear of the dock.

## Check

Run discovery/search tests, lint, and the web build. Check selection, browser Back,
refresh, empty results, long titles, keyboard use, and touch navigation.
In WebKit, also check search/close taps, keyboard resize and pan, dismissal,
rotation, and pinch zoom.
