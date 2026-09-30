"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { CatalogResearch } from "@/lib/catalog/research-state";
import type { SourceScoutState } from "@/lib/curation/source-scout-schema";
import { scoutSource } from "@/lib/curation/source-scout-sources";
import styles from "./starter-editorial-proposal.module.css";

export function StarterSourceScout({ providerId, research, collecting, selectedIds, onChoose }: {
  providerId: string; research: CatalogResearch | undefined; collecting: boolean;
  selectedIds: Set<string>; onChoose: (id: string) => void;
}) {
  const client = useQueryClient();
  const pollUntil = useRef(0);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [sourceClass, setSourceClass] = useState<"editorial" | "community">("editorial");
  const key = ["starter-source-scout", providerId, sourceClass];
  const ready = !collecting && research?.job?.status === "complete";
  const covered = new Set<string>(research?.proposal?.signals.map((signal) => signal.kind));
  const missing = ["mood", "scene", "style"].filter((kind) => !covered.has(kind));
  const query = useQuery<SourceScoutState>({
    queryKey: [...key, research?.job?.updated_at],
    queryFn: async () => {
      const response = await fetch(`/api/starter/source-scout?provider_id=${encodeURIComponent(providerId)}&source_class=${sourceClass}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Source links could not be checked. Try again.");
      return response.json();
    },
    enabled: ready,
    refetchInterval: (state) => state.state.data?.scout?.status === "pending" && Date.now() < pollUntil.current ? 2_000 : false,
  });
  const generate = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/starter/source-scout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: providerId, source_class: sourceClass }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Source lookup could not start. Try again.");
    },
    onSuccess: async () => { setReviewed(new Set()); pollUntil.current = Date.now() + 90_000; await client.invalidateQueries({ queryKey: key }); },
  });
  const state = query.data;
  const scout = state?.scout;
  const pending = scout?.status === "pending" && Date.parse(scout.created_at) > query.dataUpdatedAt - 120_000;
  const working = ready && !query.isError && (generate.isPending || query.isPending || Boolean(pending));
  const result = ready && !query.isError && !generate.isPending && !state?.stale && scout?.status === "complete" ? scout.result : null;
  const canGenerate = ready && missing.length > 0 && state?.available && !state.needsResearch &&
    (!scout || scout.status === "failed" || (scout.status === "pending" && !pending));
  const status = !ready ? "Finish catalog research before looking for more sources."
    : generate.isPending ? "Preparing a source lookup…"
    : query.isPending ? "Checking saved research links…"
    : query.isError ? "Source links could not be checked. Your draft is unchanged."
    : pending ? `Searching ${sourceClass === "community" ? "community discussions" : "editorial sources"}…`
    : result ? result.candidates.length ? "Research links ready. Check each original before adding a signal."
      : result.readings.length ? "Source discussion found, with no explicit tag matches. Read the originals to curate."
      : "No supported research leads found. These categories can stay empty."
    : scout?.status === "failed" || scout?.status === "pending" ? "The lookup was interrupted. Try again or curate manually."
    : !missing.length ? "Catalog sources already cover mood, scene, and style. You can review them above."
    : !state?.available ? "Source lookup is not configured. You can curate these gaps manually."
    : `Look for source discussion of missing ${missing.join(", ")} signals.`;

  return <section aria-label="Research missing signals" className="space-y-2 border-t border-border/20 pt-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-xs font-medium">Research gaps</h4>
      {canGenerate || generate.isPending ? <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2 text-xs"
        disabled={generate.isPending} onClick={() => generate.mutate()}>{generate.isPending ? "Preparing…" : "Find source links"}</Button> : null}
    </div>
    <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      Sources
      <select value={sourceClass} disabled={generate.isPending || Boolean(pending)}
        onChange={(event) => { if (event.target.value === "editorial" || event.target.value === "community") setSourceClass(event.target.value); }}
        className="min-h-10 max-w-full rounded-sm border border-border/30 bg-background px-2 text-foreground focus-visible:outline-2">
        <option value="editorial">Editorial sources</option>
        <option value="community">Community discussions</option>
      </select>
    </label>
    <div className="flex min-h-7 items-start gap-2">
      <span aria-hidden="true" className={`${styles.mark} ${working ? styles.markWorking : ""}`} />
      <p role="status" className="min-w-0 text-pretty text-xs leading-5 text-muted-foreground">
        {working ? <span className={styles.thinking}>{status}</span> : status}
      </p>
    </div>
    {query.error || generate.error ? <p role="alert" className="text-xs leading-5 text-muted-foreground">{(query.error ?? generate.error)?.message}</p> : null}
    {query.isError || scout?.status === "pending" ? <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2 text-xs"
      onClick={() => { pollUntil.current = Date.now() + 90_000; void query.refetch(); }}>Check status</Button> : null}
    {result && scout ? <div className="space-y-3 border-l border-border/40 pl-3">
      {result.readings.map((reading) => <div key={`${reading.source_url}:${reading.scope}`} className="text-xs">
        <a href={reading.source_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center underline underline-offset-4 focus-visible:outline-2">
          Read {scoutSource(reading.source_url)?.label ?? "original source"} ↗
        </a>
        <p className="text-pretty leading-5 text-muted-foreground">{reading.scope} context: {reading.matched_title}</p>
      </div>)}
      {result.candidates.map((candidate) => {
        const tag = scout.input_snapshot.vocabulary.find((item) => item.id === candidate.tag_id);
        const source = scoutSource(candidate.source_url);
        const reviewKey = `${scout.id}:${candidate.tag_id}`;
        const selected = selectedIds.has(candidate.tag_id);
        return <details key={reviewKey} className="text-xs">
          <summary className="flex min-h-10 cursor-pointer items-center rounded-sm focus-visible:outline-2">
            <span>{tag?.label ?? "Signal"} <span className="text-muted-foreground">· inferred lead</span></span>
          </summary>
          <p className="text-pretty leading-5 text-muted-foreground">{candidate.reason}</p>
          <p className="mt-1 text-pretty leading-5 text-muted-foreground">{source?.label} · {source?.evidenceClass} link · {candidate.scope} context: {candidate.matched_title}</p>
          <a href={candidate.source_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center underline underline-offset-4 focus-visible:outline-2">
            Read {source?.label ?? "original source"} ↗
          </a>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-pretty leading-5">
            <input type="checkbox" checked={reviewed.has(reviewKey)} disabled={selected}
              onChange={(event) => setReviewed((current) => {
                const next = new Set(current);
                if (event.target.checked) next.add(reviewKey); else next.delete(reviewKey);
                return next;
              })} className="size-4 shrink-0 accent-foreground focus-visible:outline-2" />
            I checked this source and this signal fits the track.
          </label>
          <Button type="button" variant="ghost" size="sm" className="min-h-10 px-2 text-xs"
            disabled={selected || !reviewed.has(reviewKey) || selectedIds.size >= 12}
            onClick={() => onChoose(candidate.tag_id)}>{selected ? "Selected" : "Add checked signal"}</Button>
        </details>;
      })}
      {result.uncertainty.map((note) => <p key={note} className="text-pretty text-xs leading-5 text-muted-foreground">{note}</p>)}
      <p className="text-pretty text-xs leading-5 text-muted-foreground">Search links are research leads. Citation matching does not verify a claim. Adding a checked signal changes this draft; Save publishes your choices.</p>
    </div> : null}
  </section>;
}
