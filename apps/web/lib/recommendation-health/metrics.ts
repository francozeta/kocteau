export const recommendationHealthWindows = [7, 14, 30, 90] as const;

export type RecommendationHealthWindow = (typeof recommendationHealthWindows)[number];

export type RecommendationHealthSummary = {
  loads: number;
  fallbacks: number;
  fallbackRate: number;
  reviewImpressions: number;
  reviewOpens: number;
  reviewOpenRate: number;
  entityOpens: number;
};

export type RecommendationReasonHealth = {
  reason: string;
  impressions: number;
  opens: number;
  openRate: number;
};

export type StarterHealthSummary = {
  impressions: number;
  passes: number;
  passRate: number;
  reviewCtas: number;
  reviewsPublished: number;
  reviewConversionRate: number;
};

export type StarterTrackHealth = StarterHealthSummary & {
  starterTrackId: string;
  providerId: string | null;
  title: string | null;
  artistName: string | null;
};

export type EntityDestinationHealth = {
  entityId: string;
  provider: string | null;
  providerId: string | null;
  type: string | null;
  title: string | null;
  artistName: string | null;
  opens: number;
};

export type StarterTagCoverage = {
  kind: string;
  taggedTracks: number;
  tagCount: number;
};

export type FeedDailyHealth = RecommendationHealthSummary & {
  day: string;
};

export type RecommendationHealthSnapshot = {
  window: {
    days: RecommendationHealthWindow;
    startAt: string | null;
    endAt: string | null;
  };
  feed: RecommendationHealthSummary;
  feedDaily: FeedDailyHealth[];
  reasons: RecommendationReasonHealth[];
  starter: StarterHealthSummary;
  starterTracks: StarterTrackHealth[];
  tagCoverage: StarterTagCoverage[];
  entities: EntityDestinationHealth[];
};

const defaultFeedSummary: RecommendationHealthSummary = {
  loads: 0,
  fallbacks: 0,
  fallbackRate: 0,
  reviewImpressions: 0,
  reviewOpens: 0,
  reviewOpenRate: 0,
  entityOpens: 0,
};

const defaultStarterSummary: StarterHealthSummary = {
  impressions: 0,
  passes: 0,
  passRate: 0,
  reviewCtas: 0,
  reviewsPublished: 0,
  reviewConversionRate: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown) {
  const numberValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function toHealthWindow(value: unknown, fallback: RecommendationHealthWindow) {
  const numberValue = toFiniteNumber(value);

  return recommendationHealthWindows.includes(
    numberValue as RecommendationHealthWindow,
  )
    ? (numberValue as RecommendationHealthWindow)
    : fallback;
}

function normalizeFeedSummary(value: unknown): RecommendationHealthSummary {
  if (!isRecord(value)) {
    return { ...defaultFeedSummary };
  }

  return {
    loads: toFiniteNumber(value.loads),
    fallbacks: toFiniteNumber(value.fallbacks),
    fallbackRate: toFiniteNumber(value.fallbackRate),
    reviewImpressions: toFiniteNumber(value.reviewImpressions),
    reviewOpens: toFiniteNumber(value.reviewOpens),
    reviewOpenRate: toFiniteNumber(value.reviewOpenRate),
    entityOpens: toFiniteNumber(value.entityOpens),
  };
}

function normalizeStarterSummary(value: unknown): StarterHealthSummary {
  if (!isRecord(value)) {
    return { ...defaultStarterSummary };
  }

  return {
    impressions: toFiniteNumber(value.impressions),
    passes: toFiniteNumber(value.passes),
    passRate: toFiniteNumber(value.passRate),
    reviewCtas: toFiniteNumber(value.reviewCtas),
    reviewsPublished: toFiniteNumber(value.reviewsPublished),
    reviewConversionRate: toFiniteNumber(value.reviewConversionRate),
  };
}

function normalizeArray<T>(value: unknown, mapper: (item: unknown) => T | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(mapper).filter((item): item is T => item !== null);
}

export function getRecommendationHealthDays(
  value: string | null | undefined,
): RecommendationHealthWindow {
  const parsed = value ? Number(value) : 14;

  return recommendationHealthWindows.includes(parsed as RecommendationHealthWindow)
    ? (parsed as RecommendationHealthWindow)
    : 14;
}

export function formatRecommendationReason(reason: string | null | undefined) {
  const safeReason = reason?.trim();

  if (!safeReason) {
    return "Unknown";
  }

  return safeReason
    .replaceAll("-", "_")
    .split("_")
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part,
    )
    .join(" ");
}

export function normalizeRecommendationHealthSnapshot(
  value: unknown,
  fallbackDays: RecommendationHealthWindow = 14,
): RecommendationHealthSnapshot {
  const payload = isRecord(value) ? value : {};
  const windowValue = isRecord(payload.window) ? payload.window : {};
  const days = toHealthWindow(windowValue.days, fallbackDays);

  return {
    window: {
      days,
      startAt: toStringOrNull(windowValue.startAt),
      endAt: toStringOrNull(windowValue.endAt),
    },
    feed: normalizeFeedSummary(payload.feed),
    feedDaily: normalizeArray(payload.feedDaily, (item) => {
      if (!isRecord(item)) {
        return null;
      }

      const day = toStringOrNull(item.day);

      if (!day) {
        return null;
      }

      return {
        day,
        ...normalizeFeedSummary(item),
      };
    }),
    reasons: normalizeArray(payload.reasons, (item) => {
      if (!isRecord(item)) {
        return null;
      }

      return {
        reason: toStringOrNull(item.reason) ?? "unknown",
        impressions: toFiniteNumber(item.impressions),
        opens: toFiniteNumber(item.opens),
        openRate: toFiniteNumber(item.openRate),
      };
    }),
    starter: normalizeStarterSummary(payload.starter),
    starterTracks: normalizeArray(payload.starterTracks, (item) => {
      if (!isRecord(item)) {
        return null;
      }

      const starterTrackId = toStringOrNull(item.starterTrackId);

      if (!starterTrackId) {
        return null;
      }

      return {
        starterTrackId,
        providerId: toStringOrNull(item.providerId),
        title: toStringOrNull(item.title),
        artistName: toStringOrNull(item.artistName),
        ...normalizeStarterSummary(item),
      };
    }),
    tagCoverage: normalizeArray(payload.tagCoverage, (item) => {
      if (!isRecord(item)) {
        return null;
      }

      const kind = toStringOrNull(item.kind);

      if (!kind) {
        return null;
      }

      return {
        kind,
        taggedTracks: toFiniteNumber(item.taggedTracks),
        tagCount: toFiniteNumber(item.tagCount),
      };
    }),
    entities: normalizeArray(payload.entities, (item) => {
      if (!isRecord(item)) {
        return null;
      }

      const entityId = toStringOrNull(item.entityId);

      if (!entityId) {
        return null;
      }

      return {
        entityId,
        provider: toStringOrNull(item.provider),
        providerId: toStringOrNull(item.providerId),
        type: toStringOrNull(item.type),
        title: toStringOrNull(item.title),
        artistName: toStringOrNull(item.artistName),
        opens: toFiniteNumber(item.opens),
      };
    }),
  };
}
