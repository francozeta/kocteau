import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, MessageSquarePlus, Music2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import EntityCoverImage from "@/components/entity-cover-image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeezerTrack } from "@/lib/deezer";
import { createPageMetadata, createTrackDescription } from "@/lib/metadata";
import { findEntityByProvider } from "@/lib/queries/entities";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ providerId: string }>;
}): Promise<Metadata> {
  const { providerId } = await params;
  const track = await getDeezerTrack(providerId);

  if (!track) {
    return createPageMetadata({
      title: "Track",
      description: "Track reviews and notes on Kocteau.",
      path: `/track/deezer/${providerId}`,
    });
  }

  const title = track.artist_name ? `${track.title} — ${track.artist_name}` : track.title;

  return createPageMetadata({
    title,
    description: createTrackDescription(track.title, track.artist_name),
    path: `/track/deezer/${providerId}`,
    image: track.cover_url,
  });
}

export default async function DeezerTrackResolverPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const existingEntity = await findEntityByProvider("deezer", "track", providerId);

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
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-5 border-b border-border/30 pb-8 lg:grid-cols-[8.5rem,minmax(0,1fr)] lg:items-start">
        <EntityCoverImage
          src={track.cover_url}
          alt={track.title}
          sizes="(max-width: 640px) 128px, 144px"
          priority
          quality={75}
          className="h-32 w-32 rounded-[1.75rem] bg-muted sm:h-36 sm:w-36"
          iconClassName="size-10"
        />

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[11px] uppercase tracking-[0.18em]">Deezer</Badge>
            <Badge variant="outline" className="border-border/25 text-[11px] uppercase tracking-[0.18em]">Track</Badge>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-[3.15rem]">{track.title}</h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              {track.artist_name ?? "Unknown artist"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/track/deezer/${providerId}?${composeParams.toString()}`}
              className={cn(buttonVariants({ size: "sm" }), "rounded-full bg-foreground text-background hover:bg-foreground/90")}
            >
              <MessageSquarePlus className="size-4" />
              New review
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(track.title)}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/30")}
            >
              Explore
            </Link>
            {track.deezer_url ? (
              <a
                href={track.deezer_url}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/30")}
              >
                Deezer
                <ExternalLink className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <Card className="rounded-[1.75rem] border-border/25 bg-card/20 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>No reviews yet</CardTitle>
          <Link href="/track" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}>
            Tracks
            <ArrowRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <Link href="/search" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full border-border/30")}>
            Search
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
