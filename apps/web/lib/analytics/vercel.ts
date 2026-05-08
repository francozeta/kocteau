import type { AnalyticsEventInput } from "@/lib/validation/schemas";

type VercelAnalyticsProperties = Record<string, string | number | boolean | null>;

export function buildVercelAnalyticsProperties({
  source,
  metadata,
}: AnalyticsEventInput): VercelAnalyticsProperties {
  const properties: VercelAnalyticsProperties = {
    source,
  };

  Object.entries(metadata).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      properties[`${key}_count`] = value.length;
      return;
    }

    properties[key] = value;
  });

  return properties;
}
