"use client";

import { useState } from "react";
import { SpinnerGapIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  curatorAvailabilityOptions,
  getCuratorStatusLabel,
  type CuratorApplication,
  type CuratorAvailability,
} from "@/lib/curators";
import { createApiError, getFirstFieldError } from "@/lib/validation/errors";
import { curatorApplicationSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

type ApplicationErrors = Partial<
  Record<"taste_focus" | "motivation" | "sample_links" | "availability", string>
>;

function ApplicationStatus({ application }: { application: CuratorApplication }) {
  const statusLabel = getCuratorStatusLabel(application.status);
  const canApplyAgain = application.status === "declined";

  return (
    <div className="rounded-[var(--kocteau-radius-card)] border border-border/24 bg-card/22 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
            Your application
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{statusLabel}</p>
        </div>
        <span className="rounded-full bg-foreground/[0.08] px-2.5 py-1 text-[11px] font-medium text-foreground/82">
          {new Intl.DateTimeFormat("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date(application.submitted_at))}
        </span>
      </div>
      <p className="mt-3 max-w-xl text-[13px] leading-5 text-muted-foreground">
        {application.status === "accepted"
          ? "You now have access to Kocteau Studio. Your picks will still pass through the same editorial queue."
          : application.status === "reviewing"
            ? "We are reading your profile, reviews, and listening perspective."
            : canApplyAgain
              ? application.decision_note ?? "This round was not the right fit. You can apply again with a clearer focus."
              : "We received it. We will review your profile and the perspective you want to bring."}
      </p>
    </div>
  );
}
export default function CuratorApplicationClient({
  initialApplication,
}: {
  initialApplication: CuratorApplication | null;
}) {
  const [application, setApplication] = useState(initialApplication);
  const [tasteFocus, setTasteFocus] = useState("");
  const [motivation, setMotivation] = useState("");
  const [sampleLinks, setSampleLinks] = useState(["", "", ""]);
  const [availability, setAvailability] =
    useState<CuratorAvailability>("occasional");
  const [fieldErrors, setFieldErrors] = useState<ApplicationErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canApply = !application || application.status === "declined";

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const payload = {
      taste_focus: tasteFocus,
      motivation,
      sample_links: sampleLinks.map((link) => link.trim()).filter(Boolean),
      availability,
    };
    const parsed = curatorApplicationSchema.safeParse(payload);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        taste_focus: getFirstFieldError(errors, "taste_focus") ?? undefined,
        motivation: getFirstFieldError(errors, "motivation") ?? undefined,
        sample_links: getFirstFieldError(errors, "sample_links") ?? undefined,
        availability: getFirstFieldError(errors, "availability") ?? undefined,
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/curator-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        throw await createApiError(response, "We could not submit your application.");
      }

      const result = (await response.json()) as { application: CuratorApplication };
      setApplication(result.application);
      setTasteFocus("");
      setMotivation("");
      setSampleLinks(["", "", ""]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {application ? <ApplicationStatus application={application} /> : null}

      {canApply ? (
        <form onSubmit={submitApplication} className="space-y-5" noValidate>
          <Field data-invalid={Boolean(fieldErrors.taste_focus)}>
            <FieldLabel htmlFor="curator-taste-focus">What do you listen for?</FieldLabel>
            <FieldDescription>
              Scenes, genres, local movements, eras, or overlooked corners you know well.
            </FieldDescription>
            <Textarea
              id="curator-taste-focus"
              value={tasteFocus}
              onChange={(event) => setTasteFocus(event.target.value)}
              placeholder="I follow…"
              maxLength={600}
              aria-invalid={Boolean(fieldErrors.taste_focus)}
              className="min-h-24 rounded-[0.7rem] border-border/22 bg-black/20 px-3 py-2.5 text-[13px] leading-5"
            />
            <FieldError>{fieldErrors.taste_focus}</FieldError>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.motivation)}>
            <FieldLabel htmlFor="curator-motivation">What perspective would you bring?</FieldLabel>
            <FieldDescription>
              Tell us how your selections could help someone hear something they would otherwise miss.
            </FieldDescription>
            <Textarea
              id="curator-motivation"
              value={motivation}
              onChange={(event) => setMotivation(event.target.value)}
              placeholder="My point of view is…"
              maxLength={1200}
              aria-invalid={Boolean(fieldErrors.motivation)}
              className="min-h-32 rounded-[0.7rem] border-border/22 bg-black/20 px-3 py-2.5 text-[13px] leading-5"
            />
            <FieldError>{fieldErrors.motivation}</FieldError>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.sample_links)}>
            <FieldLabel>Optional work</FieldLabel>
            <FieldDescription>
              Up to three links to Kocteau reviews, writing, radio, mixes, or another relevant archive.
            </FieldDescription>
            <div className="grid gap-2">
              {sampleLinks.map((link, index) => (
                <Input
                  key={index}
                  type="url"
                  inputMode="url"
                  aria-label={`Work sample ${index + 1}`}
                  value={link}
                  onChange={(event) => {
                    const nextLinks = [...sampleLinks];
                    nextLinks[index] = event.target.value;
                    setSampleLinks(nextLinks);
                  }}
                  placeholder={index === 0 ? "https://…" : "Another link…"}
                  className="h-9 rounded-full border-border/22 bg-black/20 px-3 text-[13px]"
                />
              ))}
            </div>
            <FieldError>{fieldErrors.sample_links}</FieldError>
          </Field>

          <fieldset className="space-y-2.5">
            <legend className="text-[12px] font-medium text-foreground/88">Rhythm</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {curatorAvailabilityOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "cursor-pointer rounded-[0.7rem] border px-3 py-3 transition-colors",
                    availability === option.value
                      ? "border-foreground/24 bg-foreground/[0.08]"
                      : "border-border/20 bg-card/16 hover:bg-card/28",
                  )}
                >
                  <input
                    type="radio"
                    name="availability"
                    value={option.value}
                    checked={availability === option.value}
                    onChange={() => setAvailability(option.value)}
                    className="sr-only"
                  />
                  <span className="block text-[12px] font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                    {option.note}
                  </span>
                </label>
              ))}
            </div>
            <FieldError>{fieldErrors.availability}</FieldError>
          </fieldset>

          {message ? <p role="alert" className="text-[12px] text-destructive">{message}</p> : null}

          <div className="flex items-center justify-between gap-4 border-t border-border/16 pt-4">
            <p className="max-w-sm text-[11px] leading-4 text-muted-foreground/70">
              Curators route catalog candidates. They do not publish reviews on behalf of Kocteau.
            </p>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? <SpinnerGapIcon className="size-3.5 animate-spin" /> : null}
              Submit
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
