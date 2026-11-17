"use client";

import { Button } from "@/components/ui/button";

// Keep the app shell and navigation usable when a private feed read fails.
export default function MainRouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-start justify-center gap-3 px-5 py-12"
    >
      <h1 className="text-lg font-medium text-foreground">Music is temporarily unavailable</h1>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
        We could not load this page. Your reviews and account are still here.
      </p>
      <Button type="button" variant="outline" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
