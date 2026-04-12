import type { Metadata } from "next";
import { Music2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import TrackPageHeaderBridge from "@/components/track-page-header-bridge";
import TrackPageHero from "@/components/track-page-hero";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getCurrentUser } from "@/lib/auth/server";
import { getDeezerTrack } from "@/lib/deezer";
import { createPageMetadata, createTrackDescription } from "@/lib/metadata";
import { findEntityByProvider } from "@/lib/queries/entities";

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
    noIndex: true,
  });
}

export default async function DeezerTrackResolverPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const [user, existingEntity] = await Promise.all([
    getCurrentUser(),
    findEntityByProvider("deezer", "track", providerId),
  ]);

  if (existingEntity) {
    redirect(`/track/${existingEntity.id}`);
  }

  const track = await getDeezerTrack(providerId);

  if (!track) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
      <TrackPageHeaderBridge
        title={track.title}
        artistName={track.artist_name}
        deezerUrl={track.deezer_url}
        sharePath={`/track/deezer/${providerId}`}
      />

      <TrackPageHero
        entity={{
          id: null,
          provider_id: track.provider_id,
          title: track.title,
          artist_name: track.artist_name,
          cover_url: track.cover_url,
          deezer_url: track.deezer_url,
        }}
        sharePath={`/track/deezer/${providerId}`}
        isAuthenticated={Boolean(user)}
        viewerReview={null}
      />

      <Empty className="rounded-[1.45rem] border-border/28 bg-card/20 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Music2 className="size-4" />
          </EmptyMedia>
          <EmptyTitle>No notes yet</EmptyTitle>
          <EmptyDescription>This track is still waiting for the first review.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </section>
  );
}
