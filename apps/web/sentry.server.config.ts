// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://93063a824f0328fb310fa6c9cd744780@o4508104492711936.ingest.us.sentry.io/4511130278100992",

  tracesSampleRate: isProduction ? 0.05 : 1,

  enableLogs: !isProduction,

  sendDefaultPii: false,
});
