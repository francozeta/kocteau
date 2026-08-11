"use client";

import { useState } from "react";
import Link from "next/link";
import { SpinnerGapIcon } from "@/components/ui/icons";
import { toast } from "sonner";
import UserAvatar from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCuratorStatusLabel,
  type CuratorApplication,
} from "@/lib/curators";
import { createApiError } from "@/lib/validation/errors";

export type StudioCuratorApplication = CuratorApplication & {
  applicant: {
    avatar_url: string | null;
    display_name: string | null;
    username: string | null;
  } | null;
};

export default function CuratorApplicationsStudioClient({
  initialApplications,
}: {
  initialApplications: StudioCuratorApplication[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function decide(
    application: StudioCuratorApplication,
    status: "reviewing" | "accepted" | "declined",
  ) {
    setPendingId(application.id);

    try {
      const response = await fetch("/api/studio/curator-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          status,
          decision_note: notes[application.id]?.trim() || null,
        }),
      });

      if (!response.ok) {
        throw await createApiError(response, "We could not update this application.");
      }

      const result = (await response.json()) as { application: CuratorApplication };
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? { ...item, ...result.application }
            : item,
        ),
      );
      toast.success(
        status === "accepted"
          ? "Curator access granted."
          : status === "declined"
            ? "Application closed."
            : "Application marked in review.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not update this application.");
    } finally {
      setPendingId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-[var(--kocteau-radius-card)] border border-border/22 bg-card/20 px-4 py-8 text-center text-sm text-muted-foreground">
        No curator applications yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/16 overflow-hidden rounded-[var(--kocteau-radius-card)] border border-border/22 bg-card/18">
      {applications.map((application) => {
        const isPending = pendingId === application.id;
        const isDecided = ["accepted", "declined"].includes(application.status);
        const username = application.applicant?.username;

        return (
          <article key={application.id} className="space-y-4 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  avatarUrl={application.applicant?.avatar_url}
                  displayName={application.applicant?.display_name}
                  username={username}
                  size="sm"
                  className="size-8"
                />
                <div className="min-w-0">
                  {username ? (
                    <Link href={`/u/${username}`} className="truncate text-[13px] font-medium text-foreground hover:underline">
                      @{username}
                    </Link>
                  ) : (
                    <p className="text-[13px] font-medium text-foreground">Kocteau listener</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(application.submitted_at))}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-foreground/[0.08] px-2.5 py-1 text-[11px] font-medium text-foreground/82">
                {getCuratorStatusLabel(application.status)}
              </span>
            </div>

            <div className="grid gap-4 text-[13px] leading-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/66">Taste focus</p>
                <p className="mt-1.5 whitespace-pre-wrap text-foreground/88">{application.taste_focus}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/66">Perspective</p>
                <p className="mt-1.5 whitespace-pre-wrap text-foreground/88">{application.motivation}</p>
              </div>
            </div>

            {application.sample_links.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {application.sample_links.map((href, index) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-border/22 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    Sample {index + 1}
                  </a>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5 border-t border-border/14 pt-3 sm:flex-row sm:items-center">
              <Input
                value={notes[application.id] ?? application.decision_note ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({
                    ...current,
                    [application.id]: event.target.value,
                  }))
                }
                disabled={isDecided || isPending}
                maxLength={600}
                placeholder="Private decision note…"
                className="h-8 flex-1 rounded-full border-border/20 bg-black/18 px-3 text-[12px]"
              />
              {!isDecided ? (
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {application.status === "submitted" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => void decide(application, "reviewing")}
                    >
                      In review
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => void decide(application, "declined")}
                  >
                    Decline
                  </Button>
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => void decide(application, "accepted")}
                  >
                    {isPending ? <SpinnerGapIcon className="size-3 animate-spin" /> : null}
                    Accept
                  </Button>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
