"use client";

import ReadLoadError from "@/components/shared/read-load-error";

export default function CatalogLoadError({ reset }: { reset: () => void }) {
  return (
    <ReadLoadError
      reset={reset}
      title="This page is temporarily unavailable"
      retryLabel="Retry"
    />
  );
}
