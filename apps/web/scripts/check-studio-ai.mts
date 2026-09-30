import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { generateText } from "ai";
import type { ProposalInput } from "../lib/curation/proposal-schema";

for (const path of [resolve(".env.local"), resolve("../../.env.local")]) {
  if (existsSync(path)) process.loadEnvFile(path);
}

try {
  const { studioRuntime } = await import("../lib/curation/model-runtime.ts");
  const runtime = await studioRuntime();
  const providerId = process.argv[2];
  if (!providerId) {
    const response = await generateText({ model: runtime.model, prompt: "Reply with only OK.", maxOutputTokens: 16,
      maxRetries: 0, abortSignal: AbortSignal.timeout(15_000), providerOptions: runtime.providerOptions });
    console.log(JSON.stringify({ model: runtime.id, ok: response.text.trim() === "OK", usage: response.usage }));
  } else {
    const { isDeezerProviderId } = await import("../lib/deezer.ts");
    if (!isDeezerProviderId(providerId) || !runtime.client || runtime.id !== "openai/gpt-6-luna") throw new Error("Choose a researched Deezer track and the direct research model.");
    const { proposalInput } = await import("../lib/curation/proposals.ts");
    const { runSourceScout, scoutPrompt, scoutSystem } = await import("../lib/curation/source-scout-runner.ts");
    const { estimateScoutCeiling, scoutVocabulary, sourceScoutOutputSchema } = await import("../lib/curation/source-scout-schema.ts");
    const { z } = await import("zod");
    const base = await proposalInput(providerId, "source_scout");
    const sourceClass = process.argv[3] || "editorial";
    if (sourceClass !== "editorial" && sourceClass !== "community") throw new Error("Choose editorial or community sources.");
    const input: ProposalInput | null = base ? { ...base, source_class: sourceClass } : null;
    if (!input || !scoutVocabulary(input).length) throw new Error("Finish Studio catalog research for a track with missing mood, scene, or style first.");
    const ceiling = estimateScoutCeiling(Buffer.byteLength(scoutSystem + scoutPrompt(input) + JSON.stringify(z.toJSONSchema(sourceScoutOutputSchema(input)))), runtime.inputPrice, runtime.outputPrice);
    const response = await runSourceScout(runtime.client, "gpt-6-luna", input);
    console.log(JSON.stringify({ model: runtime.id, identity: input.identity, estimatedCeilingUsd: ceiling,
      usage: response.usage, result: response.result, publication: "unchanged", persistence: "none" }, null, 2));
  }
} catch (error) {
  let providerError: { code?: string; param?: string; message?: string } | undefined;
  if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 400 &&
    "responseBody" in error && typeof error.responseBody === "string") {
    try { providerError = JSON.parse(error.responseBody).error; } catch { /* No provider diagnostics. */ }
  }
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.name : "Error",
    code: error && typeof error === "object" && "code" in error ? error.code : undefined,
    status: error && typeof error === "object" && "statusCode" in error ? error.statusCode : undefined,
    providerCode: providerError?.code, parameter: providerError?.param,
    detail: providerError?.message?.replace(/sk-[\w-]+/g, "[redacted]").slice(0, 400) ||
      (error instanceof Error && /^(Research |Choose |Finish )/.test(error.message) ? error.message : undefined) }));
  process.exitCode = 1;
}
