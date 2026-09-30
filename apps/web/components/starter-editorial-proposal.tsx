"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { catalogSourceUrl, type CatalogResearch } from "@/lib/catalog/research-state";
import type { EditorialProposal, ProposalResult, ProposalState } from "@/lib/curation/proposal-schema";
import styles from "./starter-editorial-proposal.module.css";

function ContextInsight({ insight, proposal, index, reducedMotion }: {
  insight: ProposalResult["insights"][number];
  proposal: EditorialProposal;
  index: number;
  reducedMotion: boolean;
}) {
  const [open, setOpen] = useState(index === 0);
  const tag = proposal.input_snapshot.vocabulary.find((item) => item.id === insight.tag_id);
  return <motion.div
    initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, delay: reducedMotion ? 0 : Math.min(index, 4) * 0.08, ease: [0.2, 0, 0, 1] }}>
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="text-xs">
      <summary className="flex min-h-10 cursor-pointer items-center rounded-sm focus-visible:outline-2">
        <span>{tag?.label ?? "Signal"} <span className="text-muted-foreground">· source reading</span></span>
      </summary>
      <p className="text-pretty leading-5 text-muted-foreground">{insight.rationale}</p>
      {insight.evidence_ids.map((id) => {
        const source = proposal.input_snapshot.evidence.find((item) => item.id === id);
        const support = proposal.input_snapshot.deterministic.schemaVersion === 2
          ? proposal.input_snapshot.deterministic.signals.find((item) => item.tagId === insight.tag_id)
            ?.evidence.find((item) => item.observationId === id) : null;
        const url = source ? catalogSourceUrl(source) : null;
        return source ? <div key={id} className="mt-1 text-muted-foreground">
          <span>{source.source === "deezer" ? "Deezer" : "MusicBrainz"}
            {support ? ` · ${support.evidenceClass}${support.sourceClass && support.sourceClass !== support.evidenceClass ? ` from ${support.sourceClass}` : ""}` : ""} · </span>
          <time dateTime={source.retrieved_at}>{new Date(source.retrieved_at).toLocaleDateString()}</time>
          {url ? <a href={url} target="_blank" rel="noreferrer" className="ml-2 inline-flex min-h-10 items-center underline underline-offset-4 focus-visible:outline-2">Open source ↗</a> : null}
        </div> : null;
      })}
    </details>
  </motion.div>;
}

export function StarterEditorialProposal({ providerId, research, collecting }: {
  providerId: string;
  research: CatalogResearch | undefined;
  collecting: boolean;
}) {
  const client = useQueryClient();
  const reducedMotion = useReducedMotion();
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
  const result = ready && !query.isError && !generate.isPending && !state?.stale && proposal?.status === "complete"
    ? proposal.result : null;
  const working = ready && !query.isError && (generate.isPending || query.isPending || Boolean(pending));
  const status = !ready ? research?.job?.status === "complete" && !research.proposal?.signals.length
    ? "No source-backed signals need more context. You can still curate manually."
    : "Source research comes first. You can still edit and save signals manually."
    : generate.isPending ? "Preparing a reading of the saved evidence…"
    : query.isPending ? "Checking saved context…"
    : query.isError ? "Saved context could not be checked. Your draft is unchanged."
    : pending ? "Reading the saved evidence…"
    : state?.stale ? "The sources changed. Earlier context is no longer shown."
    : proposal?.status === "complete" ? "Source reading ready. Your signal choices stay yours."
    : proposal?.status === "failed" || proposal?.status === "pending" ? "The reading was interrupted. Your draft is unchanged."
    : !state?.available ? "Optional context is unavailable. You can keep curating manually."
    : "Ask for a short reading of the proposed signals and their limits.";

  return <section aria-label="Additional source context" className="space-y-2 border-t border-border/20 pt-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-xs font-medium">Additional context</h4>
      {canGenerate || generate.isPending ? <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2 text-xs"
        disabled={generate.isPending} onClick={() => generate.mutate()}>
        {generate.isPending ? "Preparing…" : proposal ? "Refresh context" : "Prepare context"}
      </Button> : null}
    </div>
    <div className="flex min-h-7 items-start gap-2">
      <span aria-hidden="true" className={`${styles.mark} ${working ? styles.markWorking : ""}`} />
      <p role="status" className="min-w-0 text-pretty text-xs leading-5 text-muted-foreground">
        {working ? <span className={styles.thinking}>{status}</span> : status}
      </p>
    </div>
    {query.error || generate.error ? <p role="alert" className="pl-3 text-xs leading-5 text-muted-foreground">
      {(query.error ?? generate.error)?.message}
    </p> : null}
    {query.isError && ready ? <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2 text-xs"
      onClick={() => void query.refetch()}>Check again</Button> : null}
    {result && proposal ? <motion.div key={proposal.id} className="space-y-1 border-l border-border/40 pl-3"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}>
      {result.insights.length ? result.insights.map((insight, index) =>
        <ContextInsight key={insight.tag_id} insight={insight} proposal={proposal} index={index} reducedMotion={Boolean(reducedMotion)} />
      ) : <p className="py-2 text-pretty text-xs leading-5 text-muted-foreground">No further source-backed reading for these signals.</p>}
      {result.uncertainty.length ? <motion.div className="space-y-1 border-t border-border/20 pt-2"
        initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: reducedMotion ? 0 : Math.min(result.insights.length, 4) * 0.08, ease: [0.2, 0, 0, 1] }}>
        <p className="text-xs font-medium">What remains uncertain</p>
        {result.uncertainty.map((note) => <p key={note} className="text-pretty text-xs leading-5 text-muted-foreground">{note}</p>)}
      </motion.div> : null}
    </motion.div> : null}
    {proposal?.status === "pending" ? <button type="button"
      className="min-h-10 text-xs text-muted-foreground underline underline-offset-4 focus-visible:outline-2"
      onClick={() => { pollUntil.current = Date.now() + 90_000; void query.refetch(); }}>
      Check status
    </button> : null}
  </section>;
}
