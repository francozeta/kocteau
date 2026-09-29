"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { canRunCatalogResearch, type CatalogResearch } from "@/lib/catalog/research-state";

const queryKey = (providerId: string) => ["starter-catalog-research", providerId];

async function loadResearch(providerId: string, method = "GET", signal?: AbortSignal): Promise<CatalogResearch> {
  const response = await fetch(`/api/starter/research?provider_id=${encodeURIComponent(providerId)}`, {
    method, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
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

export function useStarterCatalogResearch(providerId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const [poll, setPoll] = useState({ providerId: "", until: 0 });
  useEffect(() => {
    if (!poll.until) return;
    const timeout = setTimeout(() => setPoll((current) => ({ ...current, until: 0 })),
      Math.max(0, poll.until - Date.now()));
    return () => clearTimeout(timeout);
  }, [poll.until]);
  const research = useQuery({
    queryKey: queryKey(providerId),
    queryFn: ({ signal }) => loadResearch(providerId, "GET", signal),
    enabled: enabled && Boolean(providerId),
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      return poll.providerId === providerId && Date.now() < poll.until &&
        (status === "pending" || status === "processing") ? 2_000 : false;
    },
  });
  const { mutate, isPending, variables, error: startError } = useMutation({
    mutationFn: async (id: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: queryKey(id), queryFn: ({ signal }) => loadResearch(id, "GET", signal),
        staleTime: 0, retry: false,
      });
      return canRunCatalogResearch(data) ? loadResearch(id, "POST") : data;
    },
    onSuccess: (data, id) => { queryClient.setQueryData(queryKey(id), data); },
  });
  const start = useCallback((id: string) => {
    setPoll({ providerId: id, until: Date.now() + 90_000 });
    mutate(id);
  }, [mutate]);
  const starting = variables === providerId && isPending;
  const error = research.error ?? (variables === providerId ? startError : null);
  const status = research.data?.job?.status;
  const collecting = enabled && !error && (research.isPending || starting ||
    (poll.providerId === providerId && poll.until > 0 && (status === "pending" || status === "processing")));
  return {
    data: research.data, error, collecting, starting, start,
    proposal: collecting ? null : research.data?.proposal ?? null,
  };
}
