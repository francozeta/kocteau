"use client";

import { Button } from "@/components/ui/button";

// Public identity failures are recoverable; only confirmed absence is a 404.
export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-3 px-6 py-20">
      <h1 className="text-lg font-medium">Profile temporarily unavailable</h1>
      <p className="text-sm text-muted-foreground">
        This profile could not be loaded right now.
      </p>
      <Button type="button" variant="outline" onClick={reset}>
        Retry profile
      </Button>
    </div>
  );
}
