import { z } from "zod";
import type { CatalogSignalProposal } from "@/lib/catalog/signal-proposals";
import type { EvidenceClass } from "@/lib/catalog/source-evidence";

export const proposalSchema = z.object({
  insights: z.array(z.object({
    tag_id: z.uuid(),
    evidence_ids: z.array(z.uuid()).min(1).max(3),
    rationale: z.string().min(1).max(240),
  }).strict()).max(6),
  uncertainty: z.array(z.string().min(1).max(240)).max(3),
}).strict();

export type ProposalResult = z.infer<typeof proposalSchema>;
export type ProposalInput = {
  identity: { id: string; provider_id: string; title: string; artist_name: string | null };
  deterministic: CatalogSignalProposal;
  evidence: {
    id: string; source: string; source_entity_type: string; source_entity_id: string | null;
    status: string; facts: Record<string, string | string[]>; retrieved_at: string;
    field_classes?: Record<string, EvidenceClass>;
  }[];
  vocabulary: { id: string; label: string; slug: string; kind: string }[];
};

export type EditorialProposal = {
  id: string; status: string; created_at: string; error_code: string | null;
  input_snapshot: ProposalInput; result: ProposalResult | null;
};

export type ProposalState = {
  proposal: EditorialProposal | null;
  available: boolean;
  stale: boolean;
  needsResearch: boolean;
};

export function proposalOutputSchema(input: ProposalInput) {
  const ids = input.deterministic.signals.map((signal) => signal.tagId);
  if (!ids.length) return proposalSchema.extend({ insights: proposalSchema.shape.insights.max(0) });
  return proposalSchema.extend({ insights: z.array(proposalSchema.shape.insights.element.extend({
    tag_id: z.enum(ids),
    evidence_ids: z.array(z.enum(input.evidence.map((source) => source.id))).min(1).max(3),
  })).max(6) });
}

export function validateProposal(value: unknown, input: ProposalInput): ProposalResult {
  const result = proposalSchema.parse(value);
  const seen = new Set<string>();
  for (const insight of result.insights) {
    const signal = input.deterministic.signals.find((item) => item.tagId === insight.tag_id);
    if (!signal || seen.has(insight.tag_id) || new Set(insight.evidence_ids).size !== insight.evidence_ids.length) {
      throw new Error("Insight does not match a proposed signal.");
    }
    seen.add(insight.tag_id);
    const allowed = new Set(signal.evidence.map((item) => item.observationId));
    if (!insight.evidence_ids.every((id) => allowed.has(id) &&
      input.evidence.some((source) => source.id === id && source.status === "resolved"))) {
      throw new Error("Insight lacks proposed evidence.");
    }
  }
  return result;
}

export function estimateProposalCeiling(inputBytes: number, inputPrice: number, outputPrice: number) {
  if (!Number.isFinite(inputPrice) || !Number.isFinite(outputPrice) || inputPrice < 0 || outputPrice < 0 ||
    inputPrice > 0.0000003 || outputPrice > 0.000002 || inputBytes > 32_000) {
    throw new Error("Proposal exceeds the configured price or input limit.");
  }
  const estimate = ((inputBytes + 4_000) * inputPrice + 2_048 * outputPrice) * 1.2;
  if (estimate > 0.02) throw new Error("Proposal exceeds the request allowance.");
  return estimate;
}
