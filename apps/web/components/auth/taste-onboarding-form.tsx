"use client";

import { AlertCircle, Check, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import {
  tasteOnboardingMaxTags,
  tasteOnboardingMinTags,
  type PreferenceTag,
} from "@/lib/taste";
import { cn } from "@/lib/utils";

type TasteOnboardingFormProps = {
  tags: PreferenceTag[];
  initialSelectedTagIds?: string[];
};

type SaveTasteResponse = {
  error?: string;
  redirectTo?: string;
};

export function TasteOnboardingForm({
  tags,
  initialSelectedTagIds = [],
}: TasteOnboardingFormProps) {
  const router = useRouter();
  const visibleTagIds = new Set(tags.map((tag) => tag.id));
  const [selectedIds, setSelectedIds] = useState(
    () =>
      new Set(initialSelectedTagIds.filter((tagId) => visibleTagIds.has(tagId))),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCount = selectedIds.size;
  const progressValue = Math.min(
    100,
    Math.round((selectedCount / tasteOnboardingMinTags) * 100),
  );
  const canSubmit =
    selectedCount >= tasteOnboardingMinTags &&
    selectedCount <= tasteOnboardingMaxTags &&
    !isSaving;
  const missingCount = Math.max(tasteOnboardingMinTags - selectedCount, 0);

  function toggleTag(tagId: string) {
    setError(null);
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(tagId)) {
        next.delete(tagId);
        return next;
      }

      if (next.size >= tasteOnboardingMaxTags) {
        setError(`Choose ${tasteOnboardingMaxTags} taste tags or fewer.`);
        return current;
      }

      next.add(tagId);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (selectedCount < tasteOnboardingMinTags) {
      setError(`Choose at least ${tasteOnboardingMinTags} taste tags.`);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/preferences/taste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagIds: Array.from(selectedIds) }),
      });
      const data = (await response.json().catch(() => ({}))) as SaveTasteResponse;

      if (!response.ok) {
        throw new Error(data.error || "We could not save your taste profile.");
      }

      router.replace(data.redirectTo || "/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not save your taste profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <FieldGroup className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <FieldDescription>
            {selectedCount}/{tasteOnboardingMaxTags} selected
          </FieldDescription>
          <Badge
            variant={selectedCount >= tasteOnboardingMinTags ? "default" : "outline"}
          >
            {missingCount > 0 ? `${missingCount} left` : "Ready"}
          </Badge>
        </div>
        <Progress value={progressValue} />
      </FieldGroup>

      <Field>
        <div className="flex items-center justify-between gap-3">
          <FieldLabel>Primary signals</FieldLabel>
          <FieldDescription>
            Choose at least {tasteOnboardingMinTags}
          </FieldDescription>
        </div>
        <div className="rounded-xl border border-border/35 bg-background/35 p-3">
          {tags.length > 0 ? (
            <div className="flex max-h-[18rem] flex-wrap gap-2 overflow-y-auto pr-1">
              {tags.map((tag) => {
                const isSelected = selectedIds.has(tag.id);

                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 bg-muted/20 text-foreground hover:border-foreground/25 hover:bg-muted/55",
                    )}
                  >
                    <span className="truncate">{tag.label}</span>
                    {isSelected ? <Check className="size-3" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <FieldDescription>
              Taste signals are not available yet. Run the Supabase migration and refresh this page.
            </FieldDescription>
          )}
        </div>
        <FieldDescription>
          These are only the first layer. Real activity will matter more over time.
        </FieldDescription>
      </Field>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-3.5" />
          <AlertTitle>Could not save preferences</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <FieldError>
          {selectedCount < tasteOnboardingMinTags
            ? `Choose ${missingCount} more to continue.`
            : null}
        </FieldError>
      )}

      <Button type="submit" size="lg" disabled={!canSubmit}>
        {isSaving ? <LoaderCircle className="animate-spin" /> : null}
        {missingCount > 0 ? `Select ${missingCount} more` : "Continue"}
      </Button>
    </form>
  );
}
