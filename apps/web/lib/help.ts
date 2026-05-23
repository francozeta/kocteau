export const HELP_LAST_UPDATED = "May 23, 2026";

export const helpHome = {
  href: "/help",
  label: "Help",
  title: "Help",
  description: "Kocteau help, legal notes, and platform policies.",
} as const;

export const helpDocuments = [
  {
    slug: "terms",
    href: "/help/terms",
    label: "Terms",
    title: "Terms of Service",
    description: "The baseline rules for using Kocteau and publishing reviews.",
    summary: "Accounts, reviews, user content, moderation, and service terms.",
    section: "Legal",
    headings: [
      { id: "using-kocteau", label: "Using Kocteau" },
      { id: "accounts", label: "Accounts" },
      { id: "reviews-and-user-content", label: "Reviews and user content" },
      { id: "community-standards", label: "Community standards" },
      {
        id: "music-data-and-third-party-services",
        label: "Music data and third-party services",
      },
      { id: "availability-and-changes", label: "Availability and changes" },
      { id: "contact", label: "Contact" },
    ],
  },
  {
    slug: "privacy",
    href: "/help/privacy",
    label: "Privacy",
    title: "Privacy Policy",
    description: "How Kocteau handles account, review, taste, and technical data.",
    summary: "What Kocteau collects, why it is used, and the choices users have.",
    section: "Privacy",
    headings: [
      { id: "what-kocteau-collects", label: "What Kocteau collects" },
      { id: "how-kocteau-uses-information", label: "How Kocteau uses information" },
      { id: "public-content", label: "Public content" },
      { id: "service-providers", label: "Service providers" },
      { id: "choices-and-rights", label: "Choices and rights" },
      { id: "retention-and-security", label: "Retention and security" },
      { id: "contact", label: "Contact" },
    ],
  },
  {
    slug: "cookies",
    href: "/help/cookies",
    label: "Cookies",
    title: "Cookie Policy",
    description: "How Kocteau uses essential storage, preferences, and analytics.",
    summary: "Essential app storage, analytics notes, and browser controls.",
    section: "Privacy",
    headings: [
      {
        id: "how-kocteau-uses-cookies-and-local-storage",
        label: "Storage use",
      },
      { id: "essential-storage", label: "Essential storage" },
      { id: "analytics-and-monitoring", label: "Analytics and monitoring" },
      { id: "advertising-cookies", label: "Advertising cookies" },
      { id: "managing-cookies", label: "Managing cookies" },
    ],
  },
  {
    slug: "accessibility",
    href: "/help/accessibility",
    label: "Accessibility",
    title: "Accessibility",
    description: "Kocteau's accessibility goals for reading, reviewing, and navigation.",
    summary: "Keyboard support, contrast, motion, and accessibility feedback.",
    section: "Product",
    headings: [
      { id: "accessibility-goal", label: "Accessibility goal" },
      { id: "what-kocteau-prioritizes", label: "What Kocteau prioritizes" },
      { id: "motion-and-visual-comfort", label: "Motion and visual comfort" },
      { id: "feedback", label: "Feedback" },
    ],
  },
  {
    slug: "changelog",
    href: "/help/changelog",
    label: "Changelog",
    title: "Changelog",
    description: "What's new on kocteau.com.",
    summary: "Product notes, shipped polish, and release context for Kocteau.",
    section: "Product",
    headings: [
      { id: "may-23-2026", label: "May 23, 2026" },
      { id: "earlier-groundwork", label: "Earlier groundwork" },
    ],
  },
] as const;

export type HelpDocument = (typeof helpDocuments)[number];
export type HelpDocumentSlug = HelpDocument["slug"];

export const helpRoutes = [helpHome, ...helpDocuments] as const;

export const helpFooterLinks = helpDocuments.map(({ href, label }) => ({
  href,
  label,
}));

export function getHelpDocument(slug: string) {
  return helpDocuments.find((document) => document.slug === slug);
}

export function isHelpDocumentSlug(slug: string): slug is HelpDocumentSlug {
  return helpDocuments.some((document) => document.slug === slug);
}
