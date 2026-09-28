"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { canRunCatalogResearch, catalogSourceUrl, type CatalogResearch } from "@/lib/catalog/research-state";

const factLabels: Record<string, string> = {
  title: "Track", artist_name: "Artist", album_title: "Album",
  release_date: "Release", first_release_date: "First release",
  album_record_type: "Album type", record_type: "Type",
  disambiguation: "Context", tags: "Source tags · unreviewed",
};

async function loadResearch(providerId: string, method = "GET"): Promise<CatalogResearch> {
  const response = await fetch(`/api/starter/research?provider_id=${encodeURIComponent(providerId)}`, {
    method,
    ...(method === "POST" ? {
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider_id: providerId }),
    } : {}),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Catalog research is unavailable. Try again later.");
  }
  return response.json();
}

export function StarterCatalogResearch({ providerId }: { providerId: string }) {
  const queryClient = useQueryClient();
  const pollUntil = useRef(0);
  const queryKey = ["starter-catalog-research", providerId];
  const research = useQuery({
    queryKey,
    queryFn: () => loadResearch(providerId),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      return Date.now() < pollUntil.current && (status === "pending" || status === "processing") ? 2_000 : false;
    },
  });
  const start = useMutation({
    mutationFn: () => loadResearch(providerId, "POST"),
    onSuccess: (data) => {
      pollUntil.current = Date.now() + 90_000;
      queryClient.setQueryData(queryKey, data);
    },
  });
  const data = research.data;
  const job = data?.job;
  const busy = start.isPending || job?.status === "processing" || job?.status === "pending";
  const canStart = data && canRunCatalogResearch(data);
  const message = job?.status === "complete" ? "Sources collected. Review the evidence below."
    : job?.status === "failed" ? job.attempts >= 5
      ? "Research stopped after repeated failures. Earlier evidence is kept."
      : "A source could not be reached. Research will retry after a wait."
    : busy ? "Research is queued. You can keep editing while it runs."
    : "Collect catalog evidence before choosing editorial signals.";

  return (
    <section aria-label="Catalog research" className="space-y-2 border-y border-border/40 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Sources</h3>
        {canStart ? (
          <Button variant="ghost" size="sm" className="min-h-10 px-2 text-xs" disabled={start.isPending}
            onClick={() => start.mutate()}>
            {start.isPending ? "Starting…" : job && job.status !== "complete" ? "Continue research" : "Research track"}
          </Button>
        ) : null}
      </div>
      <p role="status" className="text-pretty text-xs leading-5 text-muted-foreground">
        {research.isPending ? "Loading source history…" : message}
      </p>
      {research.error || start.error ? (
        <div role="alert" className="text-xs leading-5 text-muted-foreground">
          {(research.error ?? start.error)?.message}
          <button type="button" className="ml-2 min-h-10 underline underline-offset-4 focus-visible:outline-2"
            onClick={() => { start.reset(); void research.refetch(); }}>Check again</button>
        </div>
      ) : null}
      {data?.sources.map((source) => {
        const url = catalogSourceUrl(source);
        const facts = source.facts && typeof source.facts === "object" && !Array.isArray(source.facts)
          ? Object.entries(source.facts).filter(([key, value]) => factLabels[key] &&
            (typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string"))))
          : [];
        return (
          <details key={source.source} className="text-xs">
            <summary className="flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-sm focus-visible:outline-2">
              <span>{source.source === "deezer" ? "Deezer" : "MusicBrainz"}</span>
              <span className="text-right text-muted-foreground">
                {source.status === "resolved" ? "View evidence" : source.status === "no_match" ? "No confident match" : "Source unavailable"}
              </span>
            </summary>
            <div className="space-y-2 pb-2 text-muted-foreground">
              <p>Checked <time dateTime={source.retrieved_at}>{new Date(source.retrieved_at).toLocaleString()}</time></p>
              {source.match_score !== null ? <p>Search match: {source.match_score}/100 · not editorial confidence</p> : null}
              {facts.length ? <dl className="space-y-2">
                {facts.map(([key, value]) => <div key={key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                  <dt>{factLabels[key]}</dt><dd className="break-words text-foreground/80">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
                </div>)}
              </dl> : null}
              {url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center underline underline-offset-4 focus-visible:outline-2">Open source ↗</a> : null}
            </div>
          </details>
        );
      })}
      {job && job.status !== "complete" ? (
        <button type="button" className="min-h-10 text-xs text-muted-foreground underline underline-offset-4 focus-visible:outline-2"
          onClick={() => { pollUntil.current = Date.now() + 90_000; void research.refetch(); }}>Check progress</button>
      ) : null}
    </section>
  );
}
