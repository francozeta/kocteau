import * as Sentry from "@sentry/nextjs";
import { getSentryOptions } from "./lib/sentry-config";

Sentry.init(
  getSentryOptions({
    production: process.env.NODE_ENV === "production",
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  }),
);
