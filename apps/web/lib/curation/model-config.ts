export function studioModelConfig(env: Record<string, string | undefined>) {
  const key = env.OPENAI_API_KEY || env.OPENAI_KEY;
  const provider = env.STUDIO_AI_PROVIDER || (key ? "openai" : "gateway");
  if (provider !== "openai" && provider !== "gateway") return null;
  const enabled = env.STUDIO_PROPOSALS_ENABLED !== "0";
  if (provider === "openai") return {
    provider, model: env.STUDIO_OPENAI_MODEL || "gpt-6-luna",
    available: enabled && Boolean(key),
  };
  return {
    provider, model: env.STUDIO_PROPOSAL_MODEL || "openai/gpt-6-luna",
    available: enabled && Boolean(env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN || env.VERCEL),
  };
}
