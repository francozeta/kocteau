import { NextResponse } from "next/server";
import { Client } from "eve/client";
import { z } from "zod";
import { requireStarterCurator } from "@/lib/curation/access";
import { preferenceKindOrder } from "@/lib/taste";
import { starterEveSuggestionSchema } from "@/lib/validation/schemas";
import { validationErrorResponse } from "@/lib/validation/server";

const starterSignalLimit = 12;

const missingTagIdeaSchema = z.object({
  kind: z.enum(preferenceKindOrder),
  label: z.string().trim().min(2).max(32),
  reason: z.string().trim().max(160).nullable().optional(),
});

const suggestedSignalSchema = z.object({
  tagId: z.string(),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  reason: z.string().trim().max(140).nullable().default(null),
});

const starterEveSuggestionOutputSchema = z.object({
  suggestedSignals: z.array(suggestedSignalSchema).max(starterSignalLimit).default([]),
  suggestedTagIds: z.array(z.string()).max(starterSignalLimit).default([]),
  prompt: z.string().trim().max(160).nullable().default(null),
  editorialNote: z.string().trim().max(240).nullable().default(null),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  rationale: z.string().trim().max(360).nullable().default(null),
  missingTagIdeas: z.array(missingTagIdeaSchema).max(6).default([]),
});

type StarterEveSuggestionOutput = z.infer<typeof starterEveSuggestionOutputSchema>;

function truncateText(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim() ?? "";

  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function uniqueAllowedTagIds(tagIds: string[], allowedTagIds: Set<string>) {
  const unique = new Set<string>();

  for (const tagId of tagIds) {
    if (!allowedTagIds.has(tagId)) {
      continue;
    }

    unique.add(tagId);

    if (unique.size >= starterSignalLimit) {
      break;
    }
  }

  return Array.from(unique);
}

function uniqueAllowedSignals(
  signals: StarterEveSuggestionOutput["suggestedSignals"],
  allowedTagIds: Set<string>,
) {
  const seen = new Set<string>();
  const result: StarterEveSuggestionOutput["suggestedSignals"] = [];

  for (const signal of signals) {
    if (!allowedTagIds.has(signal.tagId) || seen.has(signal.tagId)) {
      continue;
    }

    seen.add(signal.tagId);
    result.push({
      tagId: signal.tagId,
      confidence: signal.confidence,
      reason: truncateText(signal.reason, 140),
    });

    if (result.length >= starterSignalLimit) {
      break;
    }
  }

  return result;
}

function buildSuggestionPrompt(input: {
  track: z.infer<typeof starterEveSuggestionSchema>["track"];
  selectedTags: unknown[];
  availableTags: unknown[];
}) {
  return `Suggest curation metadata for this Kocteau Starter Studio track.

Return structured output using the requested schema. Use existing tag IDs only.
Do not write to Supabase. Do not call local draft tools.

Studio context:
${JSON.stringify(input, null, 2)}`;
}

export async function POST(req: Request) {
  const curator = await requireStarterCurator();

  if (!curator.ok) {
    return curator.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = starterEveSuggestionSchema.safeParse(payload);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Eve suggestion request is invalid.");
  }

  const { data: tags, error: tagsError } = await curator.supabase
    .from("preference_tags")
    .select("id, kind, slug, label, description, is_featured, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("kind", { ascending: true })
    .order("label", { ascending: true });

  if (tagsError) {
    return NextResponse.json(
      { error: "We could not load starter signals for Eve." },
      { status: 500 },
    );
  }

  const availableTags = tags ?? [];
  const allowedTagIds = new Set(availableTags.map((tag) => tag.id));
  const selectedTagIds = uniqueAllowedTagIds(parsed.data.selected_tag_ids, allowedTagIds);
  const selectedTagIdSet = new Set(selectedTagIds);
  const selectedTags = availableTags.filter((tag) => selectedTagIdSet.has(tag.id));

  const url = new URL(req.url);
  const client = new Client({
    host: url.origin,
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
  });
  const session = client.session();
  const response = await session.send<StarterEveSuggestionOutput>({
    message: buildSuggestionPrompt({
      track: parsed.data.track,
      selectedTags,
      availableTags,
    }),
    outputSchema: starterEveSuggestionOutputSchema,
  });
  const result = await response.result();
  const rawSuggestion = result.data;

  if (!rawSuggestion) {
    return NextResponse.json(
      { error: "Eve did not return a suggestion." },
      { status: 502 },
    );
  }

  const suggestedSignals = uniqueAllowedSignals(
    rawSuggestion.suggestedSignals.length > 0
      ? rawSuggestion.suggestedSignals
      : rawSuggestion.suggestedTagIds.map((tagId) => ({
          tagId,
          confidence: rawSuggestion.confidence,
          reason: null,
        })),
    allowedTagIds,
  );
  const suggestedTagIds = suggestedSignals.length > 0
    ? suggestedSignals.map((signal) => signal.tagId)
    : uniqueAllowedTagIds(selectedTagIds, allowedTagIds);

  const suggestion = {
    suggestedSignals,
    suggestedTagIds,
    prompt: truncateText(rawSuggestion.prompt, 160),
    editorialNote: truncateText(rawSuggestion.editorialNote, 240),
    confidence: rawSuggestion.confidence,
    rationale: truncateText(rawSuggestion.rationale, 360),
    missingTagIdeas: rawSuggestion.missingTagIdeas,
  };

  return NextResponse.json({ ok: true, suggestion });
}
