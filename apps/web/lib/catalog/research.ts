import "server-only";

import { getDeezerTrack } from "@/lib/deezer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { needsCatalogResearchRefresh, type CatalogResearch } from "./research-state";
import { buildCatalogSignalProposal } from "./signal-proposals";

async function findResearchEntity(providerId: string) {
  const { data, error } = await supabaseAdmin().from("entities").select("id,title,artist_name")
    .eq("provider", "deezer").eq("provider_id", providerId).eq("type", "track")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function readCatalogResearch(providerId: string): Promise<CatalogResearch> {
  const entity = await findResearchEntity(providerId);
  if (!entity) return { job: null, sources: [], proposal: null };
  const supabase = supabaseAdmin();
  const { data: job, error } = await supabase.from("catalog_enrichment_jobs")
    .select("id,status,attempts,next_attempt_at,updated_at")
    .eq("target_type", "entity").eq("target_id", entity.id).maybeSingle();
  if (error) throw error;
  if (!job) return { job: null, sources: [], proposal: null };
  const [sources, tags] = await Promise.all([Promise.all([
    ["deezer", "track"], ["deezer", "album"], ["musicbrainz", "recording"],
  ].map(async ([source, type]) => {
    const { data, error: sourceError } = await supabase.from("catalog_source_observations")
      .select("id,source,source_entity_type,source_entity_id,status,lookup,facts,match_score,retrieved_at")
      .eq("job_id", job.id).eq("source", source).eq("source_entity_type", type)
      .order("retrieved_at", { ascending: false }).order("id").limit(1).maybeSingle();
    if (sourceError) throw sourceError;
    return data;
  })), supabase.from("preference_tags").select("id,kind,slug,label").order("id")]);
  if (tags.error) throw tags.error;
  const observations = sources.filter((source) => source !== null);
  return {
    job, sources: observations,
    proposal: buildCatalogSignalProposal({ provider: "deezer", providerId, type: "track", title: entity.title, artistName: entity.artist_name }, observations, tags.data),
  };
}

export async function ensureCatalogResearch(providerId: string) {
  const supabase = supabaseAdmin();
  let entity = await findResearchEntity(providerId);
  if (!entity) {
    const track = await getDeezerTrack(providerId, { throwOnError: true });
    if (!track) return null;
    const { error } = await supabase.from("entities").upsert({
      provider: "deezer", provider_id: providerId, type: "track",
      title: track.title, artist_name: track.artist_name,
      cover_url: track.cover_url, deezer_url: track.deezer_url,
    }, { onConflict: "provider,type,provider_id", ignoreDuplicates: true });
    if (error) throw error;
    entity = await findResearchEntity(providerId);
  }
  if (!entity) throw new Error("Catalog identity could not be resolved.");
  const { error } = await supabase.from("catalog_enrichment_jobs").upsert({
    target_type: "entity", target_id: entity.id,
  }, { onConflict: "target_type,target_id", ignoreDuplicates: true });
  if (error) throw error;
  const research = await readCatalogResearch(providerId);
  if (research.job?.status === "complete" && needsCatalogResearchRefresh(research)) {
    // Older name-only recording matches need one identity-checked evidence pass.
    const { error: requeueError } = await supabase.from("catalog_enrichment_jobs")
      .update({ status: "pending", attempts: 0, next_attempt_at: new Date().toISOString() })
      .eq("id", research.job.id).eq("status", "complete");
    if (requeueError) throw requeueError;
    return readCatalogResearch(providerId);
  }
  return research;
}
