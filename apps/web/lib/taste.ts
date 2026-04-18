import type { Enums, Tables } from "@/lib/supabase/database.types";

export type PreferenceKind = Enums<"preference_kind">;
export type PreferenceTag = Tables<"preference_tags">;

export const tasteOnboardingMinTags = 3;
export const tasteOnboardingMaxTags = 8;
export const tasteOnboardingPrimaryTagLimit = 24;

export const preferenceKindOrder = [
  "genre",
  "mood",
  "scene",
  "style",
  "era",
  "format",
] as const satisfies readonly PreferenceKind[];

export const preferenceKindLabels = {
  genre: "Genres",
  mood: "Moods",
  scene: "Scenes",
  style: "Styles",
  era: "Eras",
  format: "Formats",
} satisfies Record<PreferenceKind, string>;

export const preferenceKindDescriptions = {
  genre: "The lanes you naturally return to.",
  mood: "The feeling you want music to carry.",
  scene: "The worlds and rooms your taste belongs to.",
  style: "Production and writing instincts you notice.",
  era: "Time periods that keep pulling you back.",
  format: "How you tend to listen.",
} satisfies Record<PreferenceKind, string>;

export function groupPreferenceTags(tags: PreferenceTag[]) {
  const grouped = new Map<PreferenceKind, PreferenceTag[]>();

  for (const kind of preferenceKindOrder) {
    grouped.set(kind, []);
  }

  for (const tag of tags) {
    grouped.get(tag.kind)?.push(tag);
  }

  return grouped;
}
