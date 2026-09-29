"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { catalogSourceUrl, type CatalogResearch } from "@/lib/catalog/research-state";
import type { ProposalState } from "@/lib/curation/proposal-schema";

export function StarterEditorialProposal({ providerId, research, collecting }: {
  providerId: string;
  research: CatalogResearch | undefined;
  collecting: boolean;
}) {
  const client = useQueryClient();
  const pollUntil = useRef(0);
  const key = ["starter-editorial-proposal", providerId];
  const ready = !collecting && research?.job?.status === "complete" && Boolean(research.proposal?.signals.length);
  const query = useQuery<ProposalState>({
    queryKey: [...key, research?.job?.updated_at],
    queryFn: async () => {
      const response = await fetch(`/api/starter/proposals?provider_id=${encodeURIComponent(providerId)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Context is unavailable. Check again in a moment.");
      return response.json();
    },
    enabled: ready,
    refetchInterval: (state) => state.state.data?.proposal?.status === "pending" && Date.now() < pollUntil.current ? 2_000 : false,
  });
  const generate = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/starter/proposals", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider_id: providerId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Context could not start.");
    },
    onSuccess: async () => { pollUntil.current = Date.now() + 90_000; await client.invalidateQueries({ queryKey: key }); },
  });
  const state = query.data;
  const proposal = state?.proposal;
  const pending = proposal?.status === "pending" && Date.parse(proposal.created_at) > query.dataUpdatedAt - 120_000;
  const canGenerate = ready && state?.available && !state.needsResearch &&
    (!proposal || state.stale || proposal.status === "failed" || (proposal.status === "pending" && !pending));
  const result = state?.stale ? null : proposal?.result;

  return <div aria-label="Additional source context" className="space-y-2 border-t border-border/20 pt-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-xs font-medium">Additional context</h4>
      {canGenerate ? <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2 text-xs"
        disabled={generate.isPending} onClick={() => generate.mutate()}>
        {generate.isPending ? "Preparing…" : proposal ? "Refresh context" : "Prepare context"}
      </Button> : null}
    </div>
    <p role="status" className="text-pretty text-xs leading-5 text-muted-foreground">
      {!ready ? research?.job?.status === "complete" && !research.proposal?.signals.length
        ? "No source-backed signals need more context. You can still curate manually."
        : "Source research comes first. You can still edit and save signals manually." :
        query.isPending ? "Checking saved context…" : pending ? "Reading the saved evidence…" :
        state?.stale ? "The sources changed. Earlier context is no longer shown." :
        proposal?.status === "complete" ? "A second reading of the source-backed draft. Your signal choices stay yours." :
        proposal?.status === "failed" || proposal?.status === "pending" ? "Context was interrupted. Your draft is unchanged." :
        !state?.available ? "Optional context is unavailable. You can keep curating manually." :
        "Ask for a short reading of the proposed signals and their limits."}
    </p>
    {query.error || generate.error ? <p role="alert" className="text-xs leading-5 text-muted-foreground">
      {(query.error ?? generate.error)?.message}
    </p> : null}
    {result ? <div className="space-y-2">
      {result.insights.map((insight) => {
        const tag = proposal?.input_snapshot.vocabulary.find((item) => item.id === insight.tag_id);
        return <details key={insight.tag_id} className="text-xs">
          <summary className="flex min-h-10 cursor-pointer items-center rounded-sm focus-visible:outline-2">
            <span>{tag?.label ?? "Signal"} <span className="text-muted-foreground">· source context</span></span>
          </summary>
          <p className="text-pretty leading-5 text-muted-foreground">{insight.rationale}</p>
          {insight.evidence_ids.map((id) => {
            const source = proposal?.input_snapshot.evidence.find((item) => item.id === id);
            const url = source ? catalogSourceUrl(source) : null;
            return source ? <div key={id} className="mt-1 text-muted-foreground">
              <span>{source.source === "deezer" ? "Deezer" : "MusicBrainz"} · </span>
              <time dateTime={source.retrieved_at}>{new Date(source.retrieved_at).toLocaleDateString()}</time>
              {url ? <a href={url} target="_blank" rel="noreferrer" className="ml-2 inline-flex min-h-10 items-center underline underline-offset-4 focus-visible:outline-2">Open source ↗</a> : null}
            </div> : null;
          })}
        </details>;
      })}
      {result.uncertainty.map((note) => <p key={note} className="text-pretty text-xs leading-5 text-muted-foreground">{note}</p>)}
    </div> : null}
    {proposal?.status === "pending" ? <button type="button"
      className="min-h-10 text-xs text-muted-foreground underline underline-offset-4 focus-visible:outline-2"
      onClick={() => { pollUntil.current = Date.now() + 90_000; void query.refetch(); }}>
      Check status
    </button> : null}
  </div>;
}
