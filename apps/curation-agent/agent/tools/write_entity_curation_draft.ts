import { defineTool } from "eve/tools";
import { z } from "zod";
import { writeEntityCurationOutput } from "../lib/entity-curation.js";

const tagSlugsSchema = z.object({
  mood: z.array(z.string()).default([]),
  scene: z.array(z.string()).default([]),
  style: z.array(z.string()).default([]),
  era: z.array(z.string()).default([]),
  format: z.array(z.string()).default([]),
});

const draftSchema = z.object({
  entityId: z.string().min(1),
  suggestedTagSlugs: tagSlugsSchema,
  genreCandidatesForHumanReview: z.array(z.string()).default([]),
  mainstreamScore: z.number().int().min(0).max(100).nullable().optional(),
  discoveryFitScore: z.number().int().min(0).max(100).nullable().optional(),
  confidence: z.enum(["low", "medium", "high"]).nullable().optional(),
  curationNote: z.string().max(240).nullable().optional(),
  rationale: z.string().nullable().optional(),
});

export default defineTool({
  description: "Write a local entity curation draft JSON file for maintainer review.",
  inputSchema: z.object({
    humanReviewed: z.literal(false),
    reviewedBy: z.string().default(""),
    reviewedAt: z.string().default(""),
    source: z.string().default("eve:draft"),
    drafts: z.array(draftSchema),
  }),
  async execute(input) {
    return writeEntityCurationOutput(input);
  },
  toModelOutput(output) {
    return {
      type: "json",
      value: {
        outputPath: output.outputPath,
        backupPath: output.backupPath,
        drafts: output.drafts,
      },
    };
  },
});
