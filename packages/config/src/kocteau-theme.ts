export type KocteauScheme = "light" | "dark";

export const kocteauPalette = {
  light: {
    background: "#fcfcfb",
    surface: "#ffffff",
    surfaceMuted: "#f5f5f3",
    surfaceElevated: "#f1f1ef",
    foreground: "#171717",
    foregroundMuted: "#6b6b67",
    accent: "#18181b",
    accentForeground: "#fafaf9",
    border: "rgba(23, 23, 23, 0.10)",
    borderStrong: "rgba(23, 23, 23, 0.18)",
    chip: "#efeee9",
    chipForeground: "#292524",
    success: "#166534",
    warning: "#b45309",
    emphasis: "#f2eee6",
  },
  dark: {
    background: "#101011",
    surface: "#161618",
    surfaceMuted: "#1d1d21",
    surfaceElevated: "#222227",
    foreground: "#f6f6f4",
    foregroundMuted: "#b4b4ae",
    accent: "#f5f5f4",
    accentForeground: "#111112",
    border: "rgba(255, 255, 255, 0.10)",
    borderStrong: "rgba(255, 255, 255, 0.16)",
    chip: "#27272a",
    chipForeground: "#fafaf9",
    success: "#4ade80",
    warning: "#f59e0b",
    emphasis: "#1f1f24",
  },
} as const;

export const kocteauRadii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

export const kocteauSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const kocteauTypography = {
  micro: 11,
  meta: 13,
  body: 15,
  bodyLarge: 17,
  cardTitle: 20,
  sectionTitle: 24,
  heroTitle: 34,
} as const;

export function getKocteauTheme(scheme: KocteauScheme) {
  return {
    scheme,
    colors: kocteauPalette[scheme],
    radii: kocteauRadii,
    spacing: kocteauSpacing,
    typography: kocteauTypography,
  };
}
