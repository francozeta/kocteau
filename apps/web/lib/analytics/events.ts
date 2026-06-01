export const analyticsEventTypes = [
  "taste_onboarding_completed",
  "feed_loaded",
  "recommendation_fallback",
  "review_impression",
  "review_open",
  "review_read_50",
  "review_read_90",
  "entity_open",
  "for_you_review_action",
  "starter_impression",
  "starter_open",
  "starter_pass",
  "starter_review_cta",
  "starter_review_published",
] as const;

export type AnalyticsEventType = (typeof analyticsEventTypes)[number];

const legacyAnalyticsEventAliases = {
  for_you_reviews_loaded: "feed_loaded",
  for_you_fallback: "recommendation_fallback",
  for_you_recommendation_action: "starter_pass",
} as const satisfies Record<string, AnalyticsEventType>;

export const analyticsAcceptedEventTypes = [
  ...analyticsEventTypes,
  ...Object.keys(legacyAnalyticsEventAliases),
] as const;

const analyticsEventTypeSet = new Set<string>(analyticsEventTypes);

const sensitiveAnalyticsMetadataKeys = new Set([
  "email",
  "email_address",
  "ip",
  "ip_address",
  "ipaddress",
  "raw_review_text",
  "review_body",
  "review_text",
  "text_body",
  "ua",
  "user_agent",
  "useragent",
]);

export function getCanonicalAnalyticsEventType(
  eventType: string,
): AnalyticsEventType | null {
  if (analyticsEventTypeSet.has(eventType)) {
    return eventType as AnalyticsEventType;
  }

  return legacyAnalyticsEventAliases[
    eventType as keyof typeof legacyAnalyticsEventAliases
  ] ?? null;
}

export function isAllowedAnalyticsMetadataKey(key: string) {
  const trimmedKey = key.trim();
  const normalizedKey = trimmedKey.toLowerCase().replaceAll("-", "_");

  return (
    trimmedKey === key &&
    trimmedKey === normalizedKey &&
    /^[a-z0-9_]{1,64}$/.test(trimmedKey) &&
    !sensitiveAnalyticsMetadataKeys.has(normalizedKey)
  );
}
