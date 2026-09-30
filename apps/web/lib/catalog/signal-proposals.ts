import type { Database, Json } from "@/lib/supabase/database.types";
import type { PreferenceKind } from "@/lib/taste";
import { normalizeCatalogText } from "./recording-match";
import { catalogFieldEvidenceClass, catalogResearchVersion, type EvidenceClass } from "./source-evidence";

export type CatalogEvidence = Pick<Database["public"]["Tables"]["catalog_source_observations"]["Row"],
  "id" | "source" | "source_entity_type" | "source_entity_id" | "lookup" | "status" |
  "facts" | "match_score" | "retrieved_at"
>;
export type SignalVocabularyTag = { id: string; kind: PreferenceKind; slug: string; label: string };
export type CatalogIdentity = { provider: string; providerId: string; type: "track"; title: string; artistName: string | null };
type SignalBase = {
  tagId: string;
  kind: PreferenceKind;
  origin: "external" | "inferred";
  status: "suggested";
};
type EvidenceReference = { observationId: string; field: string; value: string };
type ProposalIdentity = {
  identity: CatalogIdentity;
};
type CatalogSignalProposalV1 = ProposalIdentity & {
  schemaVersion: 1;
  rulesVersion: "catalog-signals-v1";
  signals: Array<SignalBase & { evidence: EvidenceReference[] }>;
};
export type CatalogSignalProposalV2 = ProposalIdentity & {
  schemaVersion: 2;
  rulesVersion: "catalog-signals-v2";
  signals: Array<SignalBase & { evidence: Array<EvidenceReference & {
    evidenceClass: EvidenceClass;
    sourceClass: EvidenceClass | null;
  }> }>;
};
export type CatalogSignalProposal = CatalogSignalProposalV1 | CatalogSignalProposalV2;

export function catalogObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function isCurrentCatalogEvidence(source: CatalogEvidence) {
  return catalogObject(source.lookup).researchVersion === catalogResearchVersion;
}

function matchesIdentity(source: CatalogEvidence, identity: CatalogIdentity) {
  const lookup = catalogObject(source.lookup);
  return isCurrentCatalogEvidence(source) && lookup.provider === identity.provider &&
    lookup.providerId === identity.providerId && lookup.type === identity.type &&
    lookup.title === identity.title && lookup.artistName === identity.artistName;
}

export function buildCatalogSignalProposal(
  identity: CatalogIdentity, sources: CatalogEvidence[], vocabulary: SignalVocabularyTag[],
  currentYear = new Date().getUTCFullYear(),
): CatalogSignalProposalV2 | null {
  const resolved = sources.filter((source) => source.status === "resolved" && matchesIdentity(source, identity));
  const track = resolved.find((source) => source.source === "deezer" &&
    source.source_entity_type === "track" && source.source_entity_id === identity.providerId);
  if (!track) return null;
  const trackFacts = catalogObject(track.facts);
  const recording = resolved.find((source) => {
    const facts = catalogObject(source.facts);
    return source.source === "musicbrainz" && source.source_entity_type === "recording" &&
      facts.matched_title === identity.title && facts.matched_artist === identity.artistName &&
      ["isrc", "title-artist"].includes(String(facts.match_method));
  });
  const album = resolved.find((source) => source.source === "deezer" &&
    source.source_entity_type === "album" && source.source_entity_id === trackFacts.album_id);
  const signals: CatalogSignalProposalV2["signals"] = [];
  const add = (tag: SignalVocabularyTag | undefined, source: CatalogEvidence, field: string,
    value: string, evidenceClass: Exclude<EvidenceClass, "human">) => {
    if (!tag) return;
    const evidence = { observationId: source.id, field, value,
      evidenceClass,
      sourceClass: catalogFieldEvidenceClass(source, field) };
    const existing = signals.find((signal) => signal.tagId === tag.id);
    if (existing) { existing.evidence.push(evidence); return; }
    if (signals.length >= 12 || signals.filter((signal) => signal.kind === tag.kind).length >= 3) return;
    signals.push({ tagId: tag.id, kind: tag.kind,
      origin: evidenceClass === "inferred" ? "inferred" : "external",
      status: "suggested", evidence: [evidence] });
  };
  const find = (value: string, kind?: PreferenceKind) => vocabulary.find((tag) =>
    (!kind || tag.kind === kind) && [tag.slug, tag.label].some((label) =>
      normalizeCatalogText(label) === normalizeCatalogText(value)),
  );

  for (const source of [recording, album]) {
    if (!source) continue;
    const field = source === recording ? "prominent_tags" : "tags";
    const tags = catalogObject(source.facts)[field];
    if (!Array.isArray(tags)) continue;
    for (const value of tags) {
      if (typeof value !== "string") continue;
      const tag = find(value, source === album ? "genre" : undefined);
      if (tag && ["genre", "mood", "scene", "style"].includes(tag.kind)) {
        add(tag, source, field, value, source === album ? "inferred" : "community");
      }
    }
  }

  const yearFrom = (source: CatalogEvidence | undefined, field: string) => {
    const value = source && catalogObject(source.facts)[field];
    if (typeof value !== "string" || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return null;
    const year = Number(value.slice(0, 4));
    return year >= 1800 && year <= currentYear ? { source: source!, field, value, year } : null;
  };
  const date = yearFrom(recording, "first_release_date") ?? yearFrom(track, "release_date");
  if (date) {
    const era = date.year < 1970 ? "Pre-1970s" : `${Math.floor(date.year / 10) * 10}s`;
    add(find(era, "era"), date.source, date.field, date.value, "inferred");
  }
  if (album) {
    const format = catalogObject(album.facts).record_type;
    const formats: Record<string, string> = { album: "Album-focused", ep: "EPs", single: "Singles" };
    if (typeof format === "string") add(find(formats[format.toLowerCase()] ?? "", "format"), album, "record_type", format, "inferred");
  }
  return { schemaVersion: 2, rulesVersion: "catalog-signals-v2", identity, signals };
}
