"use client";

import ReadLoadError from "@/components/shared/read-load-error";

export default function ReviewLoadError({ reset }: { reset: () => void }) {
  return (
    <ReadLoadError
      reset={reset}
      title="Reviews are temporarily unavailable"
      retryLabel="Retry reviews"
    />
  );
}
