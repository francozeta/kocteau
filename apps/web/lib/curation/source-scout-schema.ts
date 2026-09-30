import { z } from "zod";
import type { ProposalInput } from "./proposal-schema";
import { scoutSource } from "./source-scout-sources";

export const scoutPromptVersion = 2;
export const scoutSearchCost = 0.01;

export const sourceScoutSchema = z.object({
  readings: z.array(z.object({
    source_url: z.string().url().max(1_800), matched_title: z.string().min(1).max(240),
    matched_artist: z.string().min(1).max(240), scope: z.enum(["track", "release"]),
  }).strict()).max(3),
  candidates: z.array(z.object({
    tag_id: z.uuid(), source_url: z.string().url().max(1_800),
    matched_title: z.string().min(1).max(240), matched_artist: z.string().min(1).max(240),
    scope: z.enum(["track", "release"]), reason: z.string().min(1).max(240),
  }).strict()).max(3),
  uncertainty: z.array(z.string().min(1).max(240)).max(3),
}).strict();

export type SourceScoutResult = z.infer<typeof sourceScoutSchema> & { consulted_urls: string[] };
export type SourceScout = {
  id: string; status: string; created_at: string; error_code: string | null;
  input_snapshot: ProposalInput; result: SourceScoutResult | null;
};
export type SourceScoutState = { scout: SourceScout | null; available: boolean; needsResearch: boolean; stale: boolean };

export function scoutVocabulary(input: ProposalInput) {
  const coveredKinds = new Set<string>(input.deterministic.signals.map((signal) => signal.kind));
  return input.vocabulary.filter((tag) => ["mood", "scene", "style"].includes(tag.kind) && !coveredKinds.has(tag.kind));
}

export function sourceScoutOutputSchema(input: ProposalInput) {
  const ids = scoutVocabulary(input).map((tag) => tag.id);
  const candidate = sourceScoutSchema.shape.candidates.element.extend({ source_url: z.string().min(1).max(1_800) });
  return sourceScoutSchema.extend({
    readings: z.array(sourceScoutSchema.shape.readings.element.extend({ source_url: z.string().min(1).max(1_800) })).max(3),
    candidates: ids.length
    ? z.array(candidate.extend({ tag_id: z.enum(ids) })).max(3)
    : z.array(candidate).max(0) });
}

const identityKey = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("en");

export function validateSourceScout(value: unknown, input: ProposalInput, consultedUrls: string[]): SourceScoutResult {
  const result = sourceScoutSchema.parse(value);
  const urls = [...new Set(consultedUrls.filter((url) => url.length <= 1_800 &&
    scoutSource(url)?.evidenceClass === (input.source_class || "editorial")))].slice(0, 80);
  const tags = new Set(scoutVocabulary(input).map((tag) => tag.id));
  const seen = new Set<string>();
  const album = input.evidence.find((source) => source.source === "deezer" && source.source_entity_type === "track")?.facts.album_title;
  for (const candidate of [...result.readings, ...result.candidates]) {
    const title = candidate.scope === "track" ? input.identity.title : typeof album === "string" ? album : null;
    if (!urls.includes(candidate.source_url) ||
      !title || identityKey(candidate.matched_title) !== identityKey(title) || !input.identity.artist_name ||
      identityKey(candidate.matched_artist) !== identityKey(input.identity.artist_name)) {
      throw new Error("Research lead has an unsupported tag, citation, or identity.");
    }
    if ("tag_id" in candidate && typeof candidate.tag_id === "string") {
      if (!tags.has(candidate.tag_id) || seen.has(candidate.tag_id) || !result.readings.some((reading) =>
        reading.source_url === candidate.source_url && reading.scope === candidate.scope && reading.matched_title === candidate.matched_title)) {
        throw new Error("Research lead lacks a matching source reading.");
      }
      seen.add(candidate.tag_id);
    }
  }
  return { ...result, consulted_urls: urls };
}

export function estimateScoutCeiling(inputBytes: number, inputPrice: number, outputPrice: number) {
  if (!Number.isFinite(inputPrice) || !Number.isFinite(outputPrice) || inputPrice < 0 || outputPrice < 0 ||
    inputPrice > 0.0000003 || outputPrice > 0.000002 || inputBytes > 32_000) throw new Error("Research exceeds the configured allowance.");
  const ceiling = scoutSearchCost + ((inputBytes + 12_000) * inputPrice + 2_048 * outputPrice) * 1.2;
  if (ceiling > 0.02) throw new Error("Research exceeds the request allowance.");
  return ceiling;
}
