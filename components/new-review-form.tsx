"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Music2, Search } from "lucide-react";
import { FaDeezer } from "react-icons/fa";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useDeezerSearch } from "@/hooks/use-deezer-search";
import RatingStars from "./rating-stars";

type DeezerResult = {
  provider: "deezer";
  provider_id: string;
  type: "track";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
  entity_id?: string | null;
};

type ReviewSubmitError = Error & {
  code?: string;
};

type NewReviewFormProps = {
  onSuccess?: () => void;
  initialQuery?: string;
  initialSelection?: DeezerResult | null;
};

type Step = "search" | "compose";

export default function NewReviewForm({
  onSuccess,
  initialQuery = "",
  initialSelection = null,
}: NewReviewFormProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<DeezerResult | null>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const suggestedSearches = ["Radiohead", "Björk", "Bad Bunny", "Frank Ocean", "Massive Attack", "The Cure"];
  const searchEnabled = step === "search";
  const normalizedQuery = query.trim();
  const { data, isFetching, error: searchError } = useDeezerSearch({
    query,
    type: "track",
    enabled: searchEnabled,
  });
  const results = useMemo(() => (searchEnabled ? ((data ?? []) as DeezerResult[]) : []), [data, searchEnabled]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialSelection) {
      setSelected(initialSelection);
      setStep("compose");
      setErrorMsg(null);
      return;
    }

    setSelected(null);
    setStep("search");
  }, [initialSelection]);

  function resetAll() {
    setStep(initialSelection ? "compose" : "search");
    setSelected(initialSelection);
    setQuery(initialQuery);
    setRating(null);
    setTitle("");
    setBody("");
    setErrorMsg(null);
  }

  function goBackToSearch() {
    if (initialSelection) {
      setSelected(initialSelection);
      setStep("compose");
      setErrorMsg(null);
      return;
    }

    setSelected(null);
    setStep("search");
    setErrorMsg(null);
  }

  async function onSubmit() {
    setErrorMsg(null);

    if (!selected) {
      setErrorMsg("Select a track before publishing.");
      return;
    }

    if (rating === null) {
      setErrorMsg("A rating is required to publish in the demo.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selected.provider,
          provider_id: selected.provider_id,
          type: selected.type,
          title: selected.title,
          artist_name: selected.artist_name,
          cover_url: selected.cover_url,
          deezer_url: selected.deezer_url,
          review_title: title.trim() ? title.trim() : null,
          review_body: body.trim() ? body.trim() : null,
          rating,
        }),
      });

      const payload = (await res.json()) as { error?: string; code?: string | null };

      if (!res.ok) {
        const error = new Error(payload.error || "Something went wrong while publishing.") as ReviewSubmitError;
        error.code = payload.code ?? undefined;
        throw error;
      }

      router.refresh();
      onSuccess?.();
      resetAll();
    } catch (error) {
      const reviewError = error as ReviewSubmitError;

      if (reviewError.code === "42501") {
        setErrorMsg("Your session expired. Please sign in again.");
      } else {
        setErrorMsg(reviewError.message || "Something went wrong while publishing.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-4">
      {step === "search" ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Search className="size-4" />
              Search
            </p>
            <Badge variant="secondary" className="shrink-0 text-xs">
              Tracks only
            </Badge>
          </div>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-4 shrink-0">
              <AlertTitle>We could not continue</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          {searchError ? (
            <Alert variant="destructive" className="mb-4 shrink-0">
              <AlertTitle>We could not search</AlertTitle>
              <AlertDescription>{searchError.message}</AlertDescription>
            </Alert>
          ) : null}

          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Track name or artist..."
            disabled={saving}
            autoFocus
            className="mb-3 h-11 shrink-0 rounded-2xl border-border/25 bg-background/60"
          />

          <ScrollArea className="min-h-0 flex-1 rounded-[1.35rem] border border-border/20 bg-card/12">
            <div className="space-y-0">
              {isFetching ? (
                <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Searching...
                </div>
              ) : null}

              {!isFetching && !normalizedQuery ? (
                <>
                  <div className="border-b px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Suggested
                    </p>
                  </div>
                  <div className="divide-y">
                    {suggestedSearches.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuery(suggestion)}
                        className="w-full px-4 py-3 text-left text-sm transition hover:bg-muted/35"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {!isFetching && normalizedQuery.length > 0 && normalizedQuery.length < 2 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Type at least 2 characters to start searching.
                  </p>
                </div>
              ) : null}

              {!isFetching && normalizedQuery.length >= 2 && results.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No tracks found.</p>
                </div>
              ) : null}

              {results.length > 0 ? (
                <div className="divide-y">
                  {results.map((result) => (
                    <button
                      key={result.provider_id}
                      type="button"
                      onClick={() => {
                        setSelected(result);
                        setStep("compose");
                        setErrorMsg(null);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/35"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                        {result.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={result.cover_url}
                            alt={result.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Music2 className="size-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{result.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {result.artist_name ?? "Unknown artist"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goBackToSearch}
              className="shrink-0 rounded-full"
            >
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to search</span>
            </Button>

            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.35rem] border border-border/20 bg-card/12 px-3 py-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-muted">
                {selected?.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.cover_url}
                    alt={selected.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Music2 className="size-5 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm">{selected?.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {selected?.artist_name ?? "Unknown artist"}
                </p>
              </div>

              {selected?.deezer_url ? (
                <Button asChild type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full">
                  <a href={selected.deezer_url} target="_blank" rel="noreferrer" title="Open on Deezer">
                    <FaDeezer className="size-4" />
                    <span className="sr-only">Open on Deezer</span>
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-5 shrink-0">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          <ScrollArea className="mb-5 min-h-0 flex-1 rounded-[1.35rem] border border-border/20 bg-card/12">
            <div className="p-5">
              <div className="space-y-6">
                <section>
                  <p className="text-sm font-medium mb-3">Rating</p>
                  <RatingStars value={rating} onChange={setRating} disabled={saving} />
                </section>

                <section className="space-y-2">
                  <label className="text-xs font-medium  tracking-wide text-muted-foreground" htmlFor="review-title">
                    Title
                  </label>
                  <Input
                    id="review-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give it a headline"
                    disabled={saving}
                    className="h-11 rounded-2xl border-border/25 bg-background/60 text-sm"
                  />
                </section>

                <section className="space-y-2">
                  <label className="text-xs font-medium  tracking-wide text-muted-foreground" htmlFor="review-body">
                    Note
                  </label>
                  <Textarea
                    id="review-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="What did this track make you feel?"
                    className="min-h-24 resize-none rounded-2xl border-border/25 bg-background/60 text-sm"
                    disabled={saving}
                  />
                </section>
              </div>
            </div>
          </ScrollArea>

          <div className="flex shrink-0 gap-3">
            <Button type="button" variant="ghost" onClick={goBackToSearch} disabled={saving} className="flex-1 rounded-2xl">
              Back
            </Button>

            <Button
              type="button"
              onClick={onSubmit}
              disabled={saving || !selected || rating === null}
              className="flex-1 rounded-2xl"
            >
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
