"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((mod) => ({
    default: mod.Toaster,
  })),
);

export default function DeferredToaster() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const idleApi = window as unknown as {
      requestIdleCallback?: typeof window.requestIdleCallback;
      cancelIdleCallback?: typeof window.cancelIdleCallback;
    };

    if (idleApi.requestIdleCallback && idleApi.cancelIdleCallback) {
      const idleId = idleApi.requestIdleCallback(() => setIsReady(true), {
        timeout: 2_000,
      });

      return () => idleApi.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(() => setIsReady(true), 1_000);

    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return isReady ? (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  ) : null;
}
