import "server-only";

import { createHash } from "node:crypto";
import { NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { proposalInput } from "./proposals";
import type { ProposalInput } from "./proposal-schema";
import { studioModelConfig } from "./model-config";
import { proposalCost, ProposalUnavailable, studioModelKey, studioRuntime, type StudioRuntime } from "./model-runtime";
import {
  estimateScoutCeiling, scoutPromptVersion, scoutSearchCost, scoutVocabulary, sourceScoutOutputSchema,
  sourceScoutSchema, validateSourceScout, type SourceScout, type SourceScoutState,
} from "./source-scout-schema";
import { runSourceScout, scoutPrompt, scoutSystem, SourceScoutOutputError } from "./source-scout-runner";

function configured() {
  const model = studioModelConfig(process.env);
  return process.env.STUDIO_SOURCE_SCOUT_ENABLED === "1" && model?.available === true && model.provider === "openai" && model.model === "gpt-6-luna";
}

function inputHash(input: ProposalInput) {
  return createHash("sha256").update(JSON.stringify({ input, model: studioModelKey(), prompt: scoutPromptVersion,
    day: new Date().toISOString().slice(0, 10) })).digest("hex");
}

const columns = "id,status,created_at,error_code,input_snapshot,result,input_hash";
function publicScout(row: { id: string; status: string; created_at: string; error_code: string | null; input_snapshot: Json; result: Json | null }): SourceScout {
  const input = row.input_snapshot as unknown as ProposalInput;
  let result = null;
  if (row.result) {
    const { consulted_urls, ...output } = sourceScoutSchema.extend({ consulted_urls: z.array(z.string().url()).max(80) }).parse(row.result);
    result = validateSourceScout(output, input, consulted_urls);
  }
  return { id: row.id, status: row.status, created_at: row.created_at, error_code: row.error_code, input_snapshot: input, result };
}

export async function readSourceScout(providerId: string, sourceClass: "editorial" | "community" = "editorial"): Promise<SourceScoutState> {
  const base = await proposalInput(providerId, "source_scout");
  const input = base ? { ...base, source_class: sourceClass } : null;
  if (!input) return { scout: null, available: configured(), needsResearch: true, stale: false };
  const { data, error } = await supabaseAdmin().from("editorial_proposals").select(columns)
    .eq("entity_id", input.identity.id).eq("input_snapshot->>purpose", "source_scout")
    .eq("input_snapshot->>source_class", sourceClass)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  const stale = Boolean(data && data.input_hash !== inputHash(input));
  return { scout: data && !stale ? publicScout(data) : null, available: configured(), needsResearch: false, stale };
}

export async function prepareSourceScout(providerId: string, userId: string, sourceClass: "editorial" | "community" = "editorial") {
  const base = await proposalInput(providerId, "source_scout");
  const input = base ? { ...base, source_class: sourceClass } : null;
  if (!input || !scoutVocabulary(input).length) throw new ProposalUnavailable("needs_research");
  const hash = inputHash(input);
  const { data: cached, error } = await supabaseAdmin().from("editorial_proposals").select("id,status,created_at")
    .eq("input_hash", hash).in("status", ["pending", "complete"]).maybeSingle();
  if (error) throw error;
  if (cached && (cached.status === "complete" || Date.parse(cached.created_at) > Date.now() - 120_000)) return { id: cached.id, run: null };
  if (!configured()) throw new ProposalUnavailable("unavailable");
  const runtime = await studioRuntime();
  if (!runtime.client) throw new ProposalUnavailable("unavailable");
  const bytes = Buffer.byteLength(scoutSystem + scoutPrompt(input) + JSON.stringify(z.toJSONSchema(sourceScoutOutputSchema(input))));
  const ceiling = estimateScoutCeiling(bytes, runtime.inputPrice, runtime.outputPrice);
  const { data, error: reserveError } = await supabaseAdmin().rpc("reserve_editorial_proposal", {
    p_entity_id: input.identity.id, p_created_by: userId, p_input_hash: hash, p_model: runtime.id,
    p_prompt_version: scoutPromptVersion, p_input_snapshot: input,
    p_observation_ids: input.evidence.map((source) => source.id), p_estimated_max_cost_usd: ceiling,
  });
  if (reserveError) {
    if (["proposal_monthly_limit", "proposal_retry_later"].includes(reserveError.message)) throw new ProposalUnavailable("limit");
    throw new ProposalUnavailable("storage");
  }
  const row = data?.[0];
  if (!row) throw new ProposalUnavailable("storage");
  return { id: row.proposal_id, run: row.created ? () => generateScout(row.proposal_id, input, runtime) : null };
}

async function generateScout(id: string, input: ProposalInput, runtime: StudioRuntime) {
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  let cost: number | null = null;
  try {
    if (!runtime.client) throw new Error("Search provider unavailable.");
    const response = await runSourceScout(runtime.client, runtime.id.replace(/^openai\//, ""), input);
    inputTokens = response.usage.inputTokens;
    outputTokens = response.usage.outputTokens;
    const tokensCost = proposalCost(runtime, inputTokens, outputTokens, undefined);
    cost = tokensCost === null ? null : tokensCost + response.searches * scoutSearchCost;
    const { error } = await supabaseAdmin().from("editorial_proposals").update({
      status: "complete", result: response.result, input_tokens: inputTokens, output_tokens: outputTokens,
      cost_usd: cost, finished_at: new Date().toISOString(),
    }).eq("id", id).eq("status", "pending");
    if (error) throw error;
  } catch (error) {
    const invalid = NoObjectGeneratedError.isInstance(error) || error instanceof SourceScoutOutputError || error instanceof z.ZodError;
    if (NoObjectGeneratedError.isInstance(error)) {
      inputTokens = error.usage?.inputTokens; outputTokens = error.usage?.outputTokens;
    }
    if (error instanceof SourceScoutOutputError) {
      inputTokens = error.usage.inputTokens; outputTokens = error.usage.outputTokens;
      const tokensCost = proposalCost(runtime, inputTokens, outputTokens, undefined);
      cost = tokensCost === null ? null : tokensCost + error.searches * scoutSearchCost;
    }
    const { error: writeError } = await supabaseAdmin().from("editorial_proposals").update({
      status: "failed", error_code: invalid ? "invalid_output" : "unavailable",
      input_tokens: inputTokens, output_tokens: outputTokens, cost_usd: cost, finished_at: new Date().toISOString(),
    }).eq("id", id).eq("status", "pending");
    if (writeError) console.error("[curation.source-scout] outcome could not be persisted", { id });
  }
}
