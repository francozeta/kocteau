export const mobileMigrationPhases = [
  {
    id: "phase-1",
    title: "Foundation",
    summary:
      "Shared tokens, shared domain types, product-aligned routes, and a mobile shell that matches Kocteau's tone.",
    items: [
      "Create shared packages for config and domain contracts.",
      "Replace Expo starter routes with feed, search, activity, and profile shells.",
      "Establish a mobile review card pattern that feels close to the web feed.",
    ],
  },
  {
    id: "phase-2",
    title: "Data Layer",
    summary:
      "Connect mobile to the same business flows the web app already uses without coupling to Next.js runtime code.",
    items: [
      "Introduce shared query keys and client-safe fetch helpers.",
      "Hydrate feed, review, track, and profile screens from live data.",
      "Add optimistic likes, bookmarks, and comments on top of React Query.",
    ],
  },
  {
    id: "phase-3",
    title: "Shared UX",
    summary:
      "Promote proven patterns into packages once both apps agree on the behavior.",
    items: [
      "Extract portable UI contracts and variants, not Next-specific components.",
      "Document when to diverge between web and native interactions.",
      "Add reusable empty, loading, and error states across both apps.",
    ],
  },
] as const;
