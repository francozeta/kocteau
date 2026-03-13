"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Music2, Search } from "lucide-react";
import { FaDeezer } from "react-icons/fa";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
};

type Step = "search" | "compose";

export default function NewReviewForm({ onSuccess }: NewReviewFormProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeezerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<DeezerResult | null>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const suggestedSearches = ["Radiohead", "Björk", "Bad Bunny", "Frank Ocean", "Massive Attack", "The Cure"];

  useEffect(() => {
    if (step !== "search" || !query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`/api/deezer/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("No se pudo buscar en Deezer.");
        }

        const data = (await res.json()) as DeezerResult[];
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setResults([]);
        setErrorMsg("No se pudo buscar en Deezer.");
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query, step]);

  function resetAll() {
    setStep("search");
    setSelected(null);
    setQuery("");
    setResults([]);
    setRating(null);
    setTitle("");
    setBody("");
    setErrorMsg(null);
  }

  function goBackToSearch() {
    setSelected(null);
    setStep("search");
    setErrorMsg(null);
  }

  async function onSubmit() {
    setErrorMsg(null);

    if (!selected) {
      setErrorMsg("Selecciona un track antes de publicar.");
      return;
    }

    if (rating === null) {
      setErrorMsg("El rating es obligatorio para publicar en la demo.");
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
        const error = new Error(payload.error || "Error al publicar la review.") as ReviewSubmitError;
        error.code = payload.code ?? undefined;
        throw error;
      }

      router.refresh();
      onSuccess?.();
      resetAll();
    } catch (error) {
      const reviewError = error as ReviewSubmitError;

      if (reviewError.code === "42501") {
        setErrorMsg("Tu sesión expiró. Vuelve a iniciar sesión.");
      } else {
        setErrorMsg(reviewError.message || "Error al publicar la review.");
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
              <AlertTitle>No pudimos continuar</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Track name or artist..."
            disabled={saving}
            autoFocus
            className="mb-3 shrink-0"
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-0">
              {searching ? (
                <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Searching...
                </div>
              ) : null}

              {!searching && !query.trim() ? (
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
                        className="w-full px-4 py-3 text-left text-sm transition hover:bg-muted/50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {!searching && query.trim() && results.length === 0 ? (
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
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted">
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
          {/* Header: Selected Track */}
          <div className="mb-5 flex items-center gap-3 shrink-0">
            <Button type="button" variant="ghost" size="icon" onClick={goBackToSearch} className="shrink-0">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Volver a buscar</span>
            </Button>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
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
                <Button asChild type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                  <a href={selected.deezer_url} target="_blank" rel="noreferrer" title="Open on Deezer">
                    <FaDeezer className="size-4" />
                    <span className="sr-only">Open on Deezer</span>
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg ? (
            <Alert variant="destructive" className="mb-5 shrink-0">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          {/* Form Content */}
          <ScrollArea className="min-h-0 flex-1 rounded-lg border mb-5">
            <div className="p-5">
              <div className="space-y-6">
                {/* Rating Section */}
                <section>
                  <p className="text-sm font-medium mb-3">Rating</p>
                  <RatingStars value={rating} onChange={setRating} disabled={saving} />
                </section>

                {/* Title Section */}
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
                    className="text-sm"
                  />
                </section>

                {/* Note Section */}
                <section className="space-y-2">
                  <label className="text-xs font-medium  tracking-wide text-muted-foreground" htmlFor="review-body">
                    Note
                  </label>
                  <Textarea
                    id="review-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="What did this track make you feel?"
                    className="min-h-20 resize-none text-sm"
                    disabled={saving}
                  />
                </section>
              </div>
            </div>
          </ScrollArea>

          {/* Action Footer */}
          <div className="flex shrink-0 gap-3">
            <Button type="button" variant="ghost" onClick={goBackToSearch} disabled={saving} className="flex-1">
              Back
            </Button>

            <Button
              type="button"
              onClick={onSubmit}
              disabled={saving || !selected || rating === null}
              className="flex-1"
            >
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
