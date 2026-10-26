const defaultDsn =
  "https://93063a824f0328fb310fa6c9cd744780@o4508104492711936.ingest.us.sentry.io/4511130278100992";

export function getSentryOptions({
  production,
  dsn,
  sampleRate,
}: {
  production: boolean;
  dsn?: string;
  sampleRate?: string;
}) {
  const parsed = sampleRate?.trim() ? Number(sampleRate) : Number.NaN;
  const rate =
    Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.01;
  const resolvedDsn = dsn === undefined ? defaultDsn : dsn.trim();

  return {
    dsn: resolvedDsn,
    enabled: production && Boolean(resolvedDsn),
    tracesSampleRate: production ? rate : 0,
    enableLogs: false,
    sendDefaultPii: false,
  };
}
