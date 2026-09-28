import type { Database } from "@/lib/supabase/database.types";

type Job = Database["public"]["Tables"]["catalog_enrichment_jobs"]["Row"];
type Observation = Database["public"]["Tables"]["catalog_source_observations"]["Row"];

export type CatalogResearch = {
  job: Pick<Job, "id" | "status" | "attempts" | "next_attempt_at" | "updated_at"> | null;
  sources: Array<Pick<Observation,
    "source" | "source_entity_type" | "source_entity_id" | "status" |
    "facts" | "match_score" | "retrieved_at"
  >>;
};

export function canRunCatalogResearch(research: CatalogResearch, now = Date.now()) {
  const job = research.job;
  if (!job) return true;
  if (job.status === "complete") return research.sources.length === 0;
  if (job.attempts >= 5) return false;
  if (job.status === "processing") return now - Date.parse(job.updated_at) >= 15 * 60_000;
  return Date.parse(job.next_attempt_at) <= now;
}

export function catalogSourceUrl(source: CatalogResearch["sources"][number]) {
  const id = source.source_entity_id;
  if (!id) return null;
  if (source.source === "deezer" && /^[1-9]\d{0,19}$/.test(id)) {
    return `https://www.deezer.com/track/${id}`;
  }
  if (source.source === "musicbrainz" && /^[0-9a-f-]{36}$/i.test(id) &&
      ["artist", "recording", "release-group"].includes(source.source_entity_type)) {
    return `https://musicbrainz.org/${source.source_entity_type}/${id}`;
  }
  return null;
}
