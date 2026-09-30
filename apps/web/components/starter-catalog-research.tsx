"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { canRunCatalogResearch, catalogSourceUrl, type CatalogResearch } from "@/lib/catalog/research-state";
import { catalogFieldEvidenceClass } from "@/lib/catalog/source-evidence";

const factLabels: Record<string, string> = {
  title: "Title", artist_name: "Artist", album_title: "Album",
  release_date: "Release", first_release_date: "First release",
  album_record_type: "Album type", record_type: "Type",
  disambiguation: "Context", tags: "Source tags · unreviewed",
  prominent_tags: "Proposal tags · unreviewed", isrc: "Recording ID",
  match_method: "Matched by",
};

export function StarterCatalogResearch({ data, error, collecting, onRetry, preservesSavedSignals, children }: {
  data: CatalogResearch | undefined;
  error: Error | null;
  collecting: boolean;
  onRetry: () => void;
  preservesSavedSignals: boolean;
  children?: ReactNode;
}) {
  const job = data?.job;
  const canRetry = !collecting && (error || !data || canRunCatalogResearch(data) || job?.status === "pending" || job?.status === "processing");
  const message = collecting ? "Finding signals from catalog sources…"
    : job?.status === "complete" ? preservesSavedSignals ? "Saved signals kept. You can edit them below."
      : data?.proposal?.signals.length ? "Signals filled from sources. Adjust anything before saving."
      : "No matching signals found. You can choose them below."
    : job?.status === "failed" ? job.attempts >= 5
      ? "Research stopped after repeated failures. Earlier evidence is kept."
      : "A source could not be reached. Research will retry after a wait."
    : job ? "Research is still queued. Save available signals or check again."
    : "Choose a track to find signals from catalog sources.";

  return (
    <section aria-label="Catalog research" className="space-y-2 border-y border-border/40 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Sources</h3>
        {canRetry ? (
          <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2 text-xs" onClick={onRetry}>
            Check again
          </Button>
        ) : null}
      </div>
      <p role="status" className="text-pretty text-xs leading-5 text-muted-foreground">
        {message}
      </p>
      {error ? (
        <div role="alert" className="text-xs leading-5 text-muted-foreground">
          {error.message} Your edits are kept.
        </div>
      ) : null}
      {data?.sources.map((source) => {
        const url = catalogSourceUrl(source);
        const facts = source.facts && typeof source.facts === "object" && !Array.isArray(source.facts)
          ? Object.entries(source.facts).filter(([key, value]) => factLabels[key] &&
            (typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string"))))
          : [];
        return (
          <details key={source.id} className="text-xs">
            <summary className="flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-sm focus-visible:outline-2">
              <span>{source.source === "deezer" ? source.source_entity_type === "album" ? "Deezer · album" : "Deezer · track" : "MusicBrainz"}</span>
              <span className="text-right text-muted-foreground">
                {source.status === "resolved" ? "View evidence" : source.status === "no_match" ? "No confident match" : "Source unavailable"}
              </span>
            </summary>
            <div className="space-y-2 pb-2 text-muted-foreground">
              <p>Checked <time dateTime={source.retrieved_at}>{new Date(source.retrieved_at).toLocaleString()}</time></p>
              {source.match_score !== null ? <p>Search match: {source.match_score}/100 · not editorial confidence</p> : null}
              {facts.length ? <dl className="space-y-2">
                {facts.map(([key, value]) => <div key={key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                  <dt>{factLabels[key]}{catalogFieldEvidenceClass(source, key) ?
                    <span className="block text-[0.65rem]">{catalogFieldEvidenceClass(source, key)}</span> : null}</dt>
                  <dd className="break-words text-foreground/80">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
                </div>)}
              </dl> : null}
              {url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center underline underline-offset-4 focus-visible:outline-2">Open source ↗</a> : null}
            </div>
          </details>
        );
      })}
      {children}
    </section>
  );
}
