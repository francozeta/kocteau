import Link from "next/link";
import { ArrowRight, ExternalLink, Music2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeezerTrack } from "@/lib/deezer";
import { supabaseServer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type ExistingEntity = {
  id: string;
};

export default async function DeezerTrackResolverPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const supabase = await supabaseServer();

  const { data: existingEntity } = await supabase
    .from("entities")
    .select("id")
    .eq("provider", "deezer")
    .eq("type", "track")
    .eq("provider_id", providerId)
    .maybeSingle<ExistingEntity>();

  if (existingEntity) {
    redirect(`/track/${existingEntity.id}`);
  }

  const track = await getDeezerTrack(providerId);

  if (!track) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden py-0">
        <CardContent className="grid gap-0 p-0 md:grid-cols-[240px_1fr]">
          <div className="flex h-72 items-center justify-center bg-muted md:h-full">
            {track.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.cover_url}
                alt={track.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Music2 className="size-10 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Deezer source</Badge>
              <Badge variant="outline">track</Badge>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{track.title}</h1>
              <p className="mt-2 text-base text-muted-foreground">
                {track.artist_name ?? "Unknown artist"}
              </p>
            </div>

            <p className="max-w-2xl text-sm text-muted-foreground">
              Este track aun no existe como entidad local en Kocteau. La primera review
              lo convertira en una pagina canonica con URL interna y feed propio.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/search?q=${encodeURIComponent(track.title)}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Buscar en Kocteau
              </Link>
              {track.deezer_url ? (
                <a
                  href={track.deezer_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Abrir en Deezer
                  <ExternalLink className="size-4" />
                </a>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todavia no hay reviews para este track</CardTitle>
          <CardDescription>
            Usa el boton de crear review del header, selecciona esta cancion y se creara
            su entidad interna automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/search" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Seguir explorando
          </Link>
          <Link href="/track" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Ver tracks existentes
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
