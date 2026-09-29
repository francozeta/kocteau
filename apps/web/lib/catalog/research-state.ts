import type { Database } from "@/lib/supabase/database.types";
import { isCurrentCatalogEvidence, type CatalogEvidence, type CatalogSignalProposal } from "./signal-proposals";

type Job = Database["public"]["Tables"]["catalog_enrichment_jobs"]["Row"];

export type CatalogResearch = {
  job: Pick<Job, "id" | "status" | "attempts" | "next_attempt_at" | "updated_at"> | null;
  sources: CatalogEvidence[];
  proposal: CatalogSignalProposal | null;
};

export function needsCatalogResearchRefresh(research: Pick<CatalogResearch, "sources">) {
  return !["deezer", "musicbrainz"].every((provider) => research.sources.some((source) =>
    source.source === provider && source.source_entity_type !== "album" && isCurrentCatalogEvidence(source),
  ));
}

export function canRunCatalogResearch(research: Pick<CatalogResearch, "job" | "sources">, now = Date.now()) {
  const job = research.job;
  if (!job) return true;
  if (job.status === "complete") return needsCatalogResearchRefresh(research);
  if (job.attempts >= 5) return false;
  if (job.status === "processing") return now - Date.parse(job.updated_at) >= 15 * 60_000;
  return Date.parse(job.next_attempt_at) <= now;
}

export function catalogSourceUrl(source: Pick<CatalogResearch["sources"][number], "source" | "source_entity_type" | "source_entity_id">) {
  const id = source.source_entity_id;
  if (!id) return null;
  if (source.source === "deezer" && /^[1-9]\d{0,19}$/.test(id)) {
    return `https://www.deezer.com/${source.source_entity_type === "album" ? "album" : "track"}/${id}`;
  }
  if (source.source === "musicbrainz" && /^[0-9a-f-]{36}$/i.test(id) &&
      ["artist", "recording", "release-group"].includes(source.source_entity_type)) {
    return `https://musicbrainz.org/${source.source_entity_type}/${id}`;
  }
  return null;
}
