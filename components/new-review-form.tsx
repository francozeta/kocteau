"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Music2, Pin, Search, Star } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import RatingStars from "./rating-stars";

type DeezerResult = {
  provider: "deezer";
  provider_id: string;
  type: "track" | "album";
  title: string;
  artist_name: string | null;
  cover_url: string | null;
  deezer_url: string | null;
};

type ReviewSubmitError = Error & {
  code?: string;
};

type NewReviewFormProps = {
  onSuccess?: () => void;
};

type Step = "search" | "compose";

export default function NewReviewForm({ onSuccess }: NewReviewFormProps) {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeezerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<DeezerResult | null>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pin, setPin] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    setPin(false);
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

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    const user = auth.user;

    if (authErr || !user) {
      setSaving(false);
      setErrorMsg("Tu sesión expiró. Vuelve a iniciar sesión.");
      return;
    }

    try {
      const { data: entity, error: entityErr } = await supabase
        .from("entities")
        .upsert(
          {
            provider: "deezer",
            provider_id: selected.provider_id,
            type: selected.type,
            title: selected.title,
            artist_name: selected.artist_name,
            cover_url: selected.cover_url,
            deezer_url: selected.deezer_url,
          },
          { onConflict: "provider,provider_id,type" }
        )
        .select("id")
        .single();

      if (entityErr) throw entityErr;

      if (pin) {
        const { error: unpinErr } = await supabase
          .from("reviews")
          .update({ is_pinned: false })
          .eq("author_id", user.id)
          .eq("is_pinned", true);

        if (unpinErr) throw unpinErr;
      }

      const { error: reviewErr } = await supabase.from("reviews").insert({
        author_id: user.id,
        entity_id: entity.id,
        rating,
        title: title.trim() ? title.trim() : null,
        body: body.trim(),
        is_pinned: pin,
      });

      if (reviewErr) throw reviewErr;

      router.refresh();
      onSuccess?.();
      resetAll();
    } catch (error) {
      const reviewError = error as ReviewSubmitError;

      if (reviewError.code === "23505") {
        setErrorMsg("Ya tienes una review pineada. Despinea la anterior e intenta otra vez.");
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
          <div className="mb-4 flex items-center gap-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Search className="size-4" />
                Buscar track
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Escribe y elige una canción para pasar al siguiente paso.
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
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
            placeholder="Ej. devon hendryx"
            disabled={saving}
            autoFocus
            className="mb-4 shrink-0"
          />

          <ScrollArea className="min-h-0 flex-1 rounded-lg border">
            <div className="px-4 py-3">
              {searching ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Buscando resultados...
                </div>
              ) : null}

              {!searching && !query.trim() ? (
                <p className="py-4 text-sm text-muted-foreground">Busca un track para empezar tu review.</p>
              ) : null}

              {!searching && query.trim() && results.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No encontramos tracks para esa búsqueda.</p>
              ) : null}

              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result) => (
                    <button
                      key={result.provider_id}
                      type="button"
                      onClick={() => {
                        setSelected(result);
                        setStep("compose");
                        setErrorMsg(null);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition hover:border-foreground/30 hover:bg-muted/40"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {result.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={result.cover_url}
                            alt={result.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Music2 className="size-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{result.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
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
          <div className="mb-4 flex items-center gap-3 shrink-0">
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
                <Button asChild type="button" variant="ghost" size="sm" className="shrink-0">
                  <a href={selected.deezer_url} target="_blank" rel="noreferrer">
                    <span className="sr-only">Abrir en Deezer</span>
                    🎵
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          {errorMsg ? (
            <Alert variant="destructive" className="mb-4 shrink-0">
              <AlertTitle>No pudimos continuar</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          ) : null}

          <ScrollArea className="min-h-0 flex-1 rounded-lg border mb-4">
            <div className="p-4">
              <div className="space-y-5">
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Star className="size-4" />
                    <p className="text-sm font-medium">Rating obligatorio</p>
                  </div>
                  <RatingStars value={rating} onChange={setRating} disabled={saving} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    El rating es el centro de la review. La nota escrita es opcional.
                  </p>
                </section>

                <Separator />

                <section className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="review-title">
                    Título opcional
                  </label>
                  <Input
                    id="review-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ej. Mi track favorito de la semana"
                    disabled={saving}
                  />
                </section>

                <section className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="review-body">
                    Nota corta opcional
                  </label>
                  <Textarea
                    id="review-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Qué te hizo sentir, por qué te gustó o por qué no."
                    className="min-h-20"
                    disabled={saving}
                  />
                </section>

                <section className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    id="pin-review"
                    checked={pin}
                    onCheckedChange={(checked) => setPin(checked === true)}
                    disabled={saving}
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor="pin-review"
                      className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                    >
                      <Pin className="size-4" />
                      Fijar en tu perfil
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Si ya tienes una pineada, esta reemplazará a la anterior.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </ScrollArea>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={goBackToSearch} disabled={saving}>
              Cambiar track
            </Button>

            <Button
              type="button"
              onClick={onSubmit}
              disabled={saving || !selected || rating === null}
            >
              {saving ? "Publicando..." : "Publicar review"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function StepPill({
  active,
  number,
  label,
}: {
  active: boolean;
  number: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        active ? "border-foreground/30 bg-muted text-foreground" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
          active ? "bg-foreground text-background" : "bg-muted"
        )}
      >
        {number}
      </span>
      {label}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-2 py-4 text-sm text-muted-foreground">{text}</p>;
}
