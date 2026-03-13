import Link from "next/link";
import { ArrowRight, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
}

export default async function TrackIndexPage() {
  const tracks = await getRecentlyDiscussedTracks(12);

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b">
          <div className="space-y-3">
            <Badge variant="secondary">Tracks</Badge>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Track pages</CardTitle>
              <CardDescription className="max-w-2xl">
                Este es el catalogo vivo de la demo: cada track existe porque alguien lo
                encontro, lo califico y dejo una review.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/search" className={cn(buttonVariants({ size: "sm" }))}>
                Buscar musica
              </Link>
              <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Volver al feed
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex items-end justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold">Recently reviewed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tracks que ya tienen historia dentro de Kocteau.
          </p>
        </div>
      </div>

      {tracks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tracks.map((track) => (
            <Link key={track.entityId} href={`/track/${track.entityId}`} className="block">
              <Card className="overflow-hidden py-0 transition-transform hover:-translate-y-0.5">
                <CardContent className="space-y-4 p-0">
                  <div className="aspect-square bg-muted">
                    {track.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Music2 className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 px-5 pb-5">
                    <div className="space-y-1">
                      <h3 className="line-clamp-1 font-semibold">{track.title}</h3>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {track.artistName ?? "Unknown artist"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Ultima review: {formatDate(track.latestReviewAt)}</span>
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todavia no hay tracks publicados</CardTitle>
            <CardDescription>
              Empieza desde search y deja la primera review para crear el primer track local.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}
