// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://93063a824f0328fb310fa6c9cd744780@o4508104492711936.ingest.us.sentry.io/4511130278100992",

  enabled: isProduction,
  tracesSampleRate: isProduction ? 0.01 : 0,
  enableLogs: false,

  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
