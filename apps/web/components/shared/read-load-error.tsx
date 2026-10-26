"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ReadLoadError({
  reset,
  title,
  retryLabel,
}: {
  reset: () => void;
  title: string;
  retryLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <section
      className="mx-auto w-full max-w-3xl space-y-4 px-4 py-12"
      role="alert"
      aria-busy={isPending}
    >
      <h1 className="font-heading text-2xl font-medium tracking-normal">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">
        Please try again in a moment.
      </p>
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
      >
        {isPending ? "Retrying…" : retryLabel}
      </Button>
    </section>
  );
}
