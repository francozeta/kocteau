import type { Metadata } from "next";
import { Music2 } from "@/components/ui/icons";
import { notFound, permanentRedirect } from "next/navigation";
import TrackPageHeaderBridge from "@/components/track-page-header-bridge";
import TrackPageHero from "@/components/track-page-hero";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getCurrentUserId } from "@/lib/auth/server";
import { getDeezerTrack, isDeezerProviderId } from "@/lib/deezer";
import { createPageMetadata, createTrackDescription } from "@/lib/metadata";
import { measureServerTask } from "@/lib/perf";
import { getEntityPageByProvider } from "@/lib/queries/entities";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ providerId: string }>;
}): Promise<Metadata> {
  const { providerId } = await params;
  if (!isDeezerProviderId(providerId)) {
    return createPageMetadata({
      title: "Track",
      description: "Track reviews and notes on Kocteau.",
      path: `/track/deezer/${providerId}`,
      noIndex: true,
    });
  }

  const existingEntity = await getEntityPageByProvider(
    "deezer",
    "track",
    providerId,
  );

  if (existingEntity) {
    return createPageMetadata({
      title: existingEntity.artist_name
        ? `${existingEntity.title} — ${existingEntity.artist_name}`
        : existingEntity.title,
      description: createTrackDescription(
        existingEntity.title,
        existingEntity.artist_name,
      ),
      path: buildEntityCanonicalPath(existingEntity),
      image: existingEntity.cover_url,
    });
  }

  const track = await getDeezerTrack(providerId);

  if (!track) {
    return createPageMetadata({
      title: "Track",
      description: "Track reviews and notes on Kocteau.",
      path: `/track/deezer/${providerId}`,
      noIndex: true,
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
  if (!isDeezerProviderId(providerId)) {
    notFound();
  }

  const [userId, existingEntity] = await measureServerTask(
    "getDeezerResolverData",
    () =>
      Promise.all([
        getCurrentUserId(),
        getEntityPageByProvider("deezer", "track", providerId),
      ]),
    { route: "/track/deezer/[providerId]" },
  );

  if (existingEntity) {
    permanentRedirect(buildEntityCanonicalPath(existingEntity));
  }

  const track = await measureServerTask(
    "getDeezerResolverTrack",
    () => getDeezerTrack(providerId),
    { route: "/track/deezer/[providerId]" },
  );

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
        isAuthenticated={Boolean(userId)}
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
