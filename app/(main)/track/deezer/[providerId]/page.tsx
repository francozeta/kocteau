import Link from "next/link";
import { ArrowRight, ExternalLink, MessageSquarePlus, Music2 } from "lucide-react";
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

  const composeParams = new URLSearchParams({
    compose: "1",
    reviewQuery: [track.title, track.artist_name].filter(Boolean).join(" "),
    composeProvider: track.provider,
    composeProviderId: track.provider_id,
    composeTitle: track.title,
  });

  if (track.artist_name) {
    composeParams.set("composeArtist", track.artist_name);
  }

  if (track.cover_url) {
    composeParams.set("composeCover", track.cover_url);
  }

  if (track.deezer_url) {
    composeParams.set("composeDeezer", track.deezer_url);
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
              This track does not exist as a local Kocteau entity yet. The first review
              will turn it into a canonical page with its own internal URL and feed.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/track/deezer/${providerId}?${composeParams.toString()}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                <MessageSquarePlus className="size-4" />
                Review this track
              </Link>
              <Link
                href={`/search?q=${encodeURIComponent(track.title)}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Search in Kocteau
              </Link>
              {track.deezer_url ? (
                <a
                  href={track.deezer_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Open in Deezer
                  <ExternalLink className="size-4" />
                </a>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>There are no reviews for this track yet</CardTitle>
          <CardDescription>
            Use the review button in the header and this song will be created as a local
            entity automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/search" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Keep exploring
          </Link>
          <Link href="/track" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            View existing tracks
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
