import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { createGateway, generateText, type LanguageModel } from "ai";
import { z } from "zod";
import { studioModelConfig } from "./model-config";

export class ProposalUnavailable extends Error {
  constructor(public readonly code: "needs_research" | "unavailable" | "limit" | "gateway_auth" | "model_auth" | "storage") { super(code); }
}

export function studioConfigured() {
  return studioModelConfig(process.env)?.available ?? false;
}

export function studioModelKey() {
  const config = studioModelConfig(process.env);
  return config ? `${config.provider}:${config.model}` : "unconfigured";
}

const timedFetch: typeof fetch = (url, init) => fetch(url, {
  ...init, signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(45_000)]) : AbortSignal.timeout(8_000),
});

export type StudioRuntime = {
  id: string; model: LanguageModel; client: ReturnType<typeof createOpenAI> | null;
  inputPrice: number; outputPrice: number; balance: number | null;
  providerOptions: NonNullable<Parameters<typeof generateText>[0]["providerOptions"]>;
};

export async function studioRuntime(): Promise<StudioRuntime> {
  const config = studioModelConfig(process.env);
  if (!config?.available) throw new ProposalUnavailable("unavailable");
  if (config.provider === "openai") {
    const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    const [access, catalog] = await Promise.all([
      timedFetch(`https://api.openai.com/v1/models/${encodeURIComponent(config.model)}`, { headers: { Authorization: `Bearer ${key}` } }),
      timedFetch("https://ai-gateway.vercel.sh/v1/models"),
    ]);
    if (access.status === 401 || access.status === 403) throw new ProposalUnavailable("model_auth");
    if (!access.ok || !catalog.ok) throw new ProposalUnavailable("unavailable");
    const parsed = z.object({ data: z.array(z.object({ id: z.string(), pricing: z.unknown() })) }).parse(await catalog.json());
    const pricing = z.object({ input: z.string(), output: z.string() }).parse(parsed.data.find((entry) => entry.id === `openai/${config.model}`)?.pricing);
    const client = createOpenAI({ apiKey: key, fetch: timedFetch });
    return {
      id: `openai/${config.model}`, model: client.responses(config.model), client,
      inputPrice: Number(pricing.input), outputPrice: Number(pricing.output), balance: null,
      providerOptions: { openai: { store: false, reasoningEffort: "none", serviceTier: "default" } },
    };
  }
  const gateway = createGateway({ fetch: timedFetch });
  try {
    const [catalog, credits] = await Promise.all([gateway.getAvailableModels(), gateway.getCredits()]);
    const pricing = catalog.models.find((entry) => entry.id === config.model)?.pricing;
    if (!pricing) throw new ProposalUnavailable("unavailable");
    return {
      id: config.model, model: gateway(config.model), client: null,
      inputPrice: Number(pricing.input), outputPrice: Number(pricing.output), balance: Number(credits.balance),
      providerOptions: { gateway: { only: [config.model.split("/")[0]] } },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "GatewayAuthenticationError") throw new ProposalUnavailable("gateway_auth");
    throw error;
  }
}

export function proposalCost(runtime: StudioRuntime, inputTokens: number | undefined, outputTokens: number | undefined, reported: unknown) {
  if ((typeof reported === "string" || typeof reported === "number") && Number.isFinite(Number(reported)) && Number(reported) >= 0) return Number(reported);
  return inputTokens !== undefined && outputTokens !== undefined
    ? inputTokens * runtime.inputPrice + outputTokens * runtime.outputPrice : null;
}
