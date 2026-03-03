"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { set } from "date-fns";
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

function clampRating(raw: string) {
  const n = Number(raw);
  if (Number.isNaN(n)) return 0;
  // 0.5 a 5.0 en pasos de 0.5
  const stepped = Math.round(n * 2) / 2;
  return Math.min(5, Math.max(0.5, stepped));
}

export default function NewReviewForm() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  // Step 1: search
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DeezerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<DeezerResult | null>(null);

  // Step 2: review form
  const [rating, setRating] = useState(4.0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pin, setPin] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    if (!q.trim() || selected) return;

    const t = setTimeout(async () => {
      setSearching(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/deezer/search?q=${encodeURIComponent(q.trim())}`);
        const data = (await res.json()) as DeezerResult[];
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
        setMsg("No se pudo buscar en Deezer.");
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [q, selected]);

  function resetSelection() {
    setSelected(null);
    setResults([]);
    setQ("");
  }

  async function onSubmit() {
    setMsg(null);

    if (!selected) return setMsg("Selecciona una canción.");
    if (!body.trim()) return setMsg("Escribe tu reseña (texto).");

    setSaving(true);

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    const user = auth.user;
    if (authErr || !user) {
      setSaving(false);
      return setMsg("No estás logueado.");
    }

    try {
      // 1) Upsert entity (deezer)
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

      // 2) Si pin, despinnea lo anterior (tu constraint lo exige)
      if (pin) {
        const { error: unpinErr } = await supabase
          .from("reviews")
          .update({ is_pinned: false })
          .eq("author_id", user.id)
          .eq("is_pinned", true);

        if (unpinErr) throw unpinErr;
      }

      // 3) Insert review
      const { error: reviewErr } = await supabase.from("reviews").insert({
        author_id: user.id,
        entity_id: entity.id,
        rating,
        title: title.trim() ? title.trim() : null,
        body: body.trim(),
        is_pinned: pin,
      });

      if (reviewErr) throw reviewErr;

      // 4) UX: refresh
      setMsg("Publicado ✅");
      router.refresh();

      resetSelection();
      setTitle("");
      setBody("");
      setPin(false);
      setRating(4.0);
    } catch (e: any) {
      setMsg(e?.message ?? "Error al publicar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {!selected ? (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar en Deezer</label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca una canción… (ej: Change Deftones)"
            />
            <p className="text-xs opacity-70">
              Escribe y elige un resultado. (Tracks por ahora)
            </p>
          </div>

          <div className="space-y-2">
            {searching && <p className="text-sm opacity-70">Buscando…</p>}

            {!searching && q.trim() && results.length === 0 && (
              <p className="text-sm opacity-70">Sin resultados.</p>
            )}

            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r.provider_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className="w-full text-left rounded-lg border p-3 hover:bg-muted transition"
                  >
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-xs opacity-70">
                      {r.artist_name ?? "Unknown artist"} • Deezer ID {r.provider_id}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium">{selected.title}</div>
            <div className="text-xs opacity-70">
              {selected.artist_name ?? "Unknown artist"} • Deezer ID {selected.provider_id}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={resetSelection}>
                Cambiar
              </Button>
              {selected.deezer_url ? (
                <a className="text-xs underline opacity-80" href={selected.deezer_url} target="_blank" rel="noreferrer">
                  Abrir en Deezer
                </a>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <RatingStars value={rating} onChange={setRating} disabled={saving} />
              <p className="text-xs opacity-70">Pasos de 0.5</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pin to profile</label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="pin"
                  type="checkbox"
                  checked={pin}
                  onChange={(e) => setPin(e.target.checked)}
                />
                <label htmlFor="pin" className="text-sm">
                  Fijar esta reseña
                </label>
              </div>
              <p className="text-xs opacity-70">Solo puede haber 1 pinned.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Título (opcional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mi experiencia con este track…"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reseña</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu review…"
              className=""
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetSelection} disabled={saving}>
              Cambiar track
            </Button>
            <Button type="button" onClick={onSubmit} disabled={saving}>
              {saving ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </>
      )}

      {msg && <p className="text-sm opacity-80">{msg}</p>}
    </div>
  );
}