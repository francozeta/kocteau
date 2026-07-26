import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import type { AtlasTag } from "@/lib/queries/atlas";
import type { DiscoveryTrack } from "@/lib/queries/discovery";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";
import type { StarterTrack } from "@/lib/starter";

type DiscoverEditorialEditionProps = {
  atlasTags: AtlasTag[];
  discussedTracks: DiscoveryTrack[];
  starterTracks: StarterTrack[];
};

function getStarterTrackHref(track: StarterTrack) {
  return `/track/deezer/${encodeURIComponent(track.provider_id)}`;
}

function getDiscussedTrackHref(track: DiscoveryTrack) {
  return buildEntityCanonicalPath({
    id: track.entityId,
    provider: track.provider,
    provider_id: track.providerId,
    type: track.type,
    title: track.title,
    artist_name: track.artistName,
  });
}

function getDiscussionMeta(track: DiscoveryTrack) {
  if (track.reviewCount <= 0) {
    return "Recently reviewed";
  }

  const reviewLabel = track.reviewCount === 1 ? "review" : "reviews";
  const rating = track.averageRating ? ` · ${track.averageRating}` : "";

  return `${track.reviewCount} ${reviewLabel}${rating}`;
}

function chooseAtlasTags(tags: AtlasTag[], limit: number) {
  const available = tags.filter((tag) => tag.starterPickCount > 0);
  const firstByKind = new Map<AtlasTag["kind"], AtlasTag>();

  for (const tag of available) {
    if (!firstByKind.has(tag.kind)) {
      firstByKind.set(tag.kind, tag);
    }
  }

  const firstTagIds = new Set(
    Array.from(firstByKind.values(), (tag) => tag.id),
  );

  return [
    ...firstByKind.values(),
    ...available.filter((tag) => !firstTagIds.has(tag.id)),
  ].slice(0, limit);
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-balance font-pixel text-[1.2rem] font-medium leading-tight tracking-[-0.02em] text-foreground sm:text-[1.35rem]">
      {children}
    </h2>
  );
}

function RotationFeature({ track }: { track: StarterTrack }) {
  const note = track.editorial_note?.trim() || track.prompt?.trim();

  return (
    <PrefetchLink
      href={getStarterTrackHref(track)}
      className="grid min-w-0 gap-4 rounded-[var(--kocteau-radius-card)] bg-[var(--kocteau-surface)] p-3 shadow-[var(--kocteau-shadow-card)] outline-none transition-[background-color,box-shadow] duration-150 ease-out hover:bg-[var(--kocteau-surface-raised)] hover:shadow-[var(--kocteau-shadow-card-hover)] focus-visible:ring-2 focus-visible:ring-ring/35 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-center"
    >
      <EntityCoverImage
        src={track.cover_url}
        alt={track.title}
        sizes="(max-width: 639px) calc(100vw - 5rem), 152px"
        quality={84}
        variant="card"
        priority
        className="aspect-square w-full rounded-[0.72rem] bg-muted/40 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] sm:size-[9.5rem]"
        iconClassName="size-7"
      />

      <div className="min-w-0 space-y-3 px-0.5 py-1">
        <div className="space-y-1">
          <p className="text-balance font-pixel text-[1.25rem] font-medium leading-tight tracking-[-0.02em] text-foreground sm:text-[1.45rem]">
            {track.title}
          </p>
          <p className="text-[13px] text-muted-foreground/78">
            {track.artist_name || "Unknown artist"}
          </p>
        </div>

        {note ? (
          <p className="line-clamp-2 max-w-md text-pretty text-[13px] leading-[1.55] text-muted-foreground/68">
            {note}
          </p>
        ) : null}

      </div>
    </PrefetchLink>
  );
}

function RotationTrack({ track }: { track: StarterTrack }) {
  return (
    <PrefetchLink
      href={getStarterTrackHref(track)}
      className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 rounded-[0.75rem] p-2 outline-none transition-colors duration-150 ease-out hover:bg-foreground/[0.035] focus-visible:ring-2 focus-visible:ring-ring/35"
    >
      <EntityCoverImage
        src={track.cover_url}
        alt=""
        sizes="52px"
        quality={76}
        variant="thumbnail"
        className="size-[3.25rem] rounded-[0.58rem] bg-muted/40 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
        iconClassName="size-4"
      />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground/90">
          {track.title}
        </p>
        <p className="truncate text-[12px] text-muted-foreground/62">
          {track.artist_name || "Unknown artist"}
        </p>
      </div>
    </PrefetchLink>
  );
}

export default function DiscoverEditorialEdition({
  atlasTags,
  discussedTracks,
  starterTracks,
}: DiscoverEditorialEditionProps) {
  const featuredTrack = starterTracks[0] ?? null;
  const rotationTracks = starterTracks.slice(1, 5);
  const visibleDiscussedTracks = discussedTracks
    .filter((track) => track.providerId !== featuredTrack?.provider_id)
    .slice(0, 6);
  const visibleAtlasTags = chooseAtlasTags(atlasTags, 8);

  return (
    <div
      className="space-y-12 pb-10 sm:space-y-14 sm:pb-14"
      data-testid="discover-edition"
    >
      {featuredTrack ? (
        <section className="space-y-4" aria-labelledby="discover-rotation-title">
          <div id="discover-rotation-title">
            <SectionHeading>In rotation</SectionHeading>
          </div>

          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.72fr)] lg:items-start">
            <RotationFeature track={featuredTrack} />

            {rotationTracks.length > 0 ? (
              <div className="grid gap-1">
                {rotationTracks.map((track) => (
                  <RotationTrack key={track.id} track={track} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {visibleDiscussedTracks.length > 0 ? (
        <section className="space-y-4" aria-labelledby="discover-discussed-title">
          <div id="discover-discussed-title">
            <SectionHeading>Recently discussed</SectionHeading>
          </div>

          <div className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
            {visibleDiscussedTracks.map((track) => (
              <PrefetchLink
                key={track.entityId}
                href={getDiscussedTrackHref(track)}
                queryWarmup={{ kind: "track", id: track.entityId }}
                className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-[0.75rem] p-2 outline-none transition-colors duration-150 ease-out hover:bg-foreground/[0.035] focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                <EntityCoverImage
                  src={track.coverUrl}
                  alt=""
                  sizes="56px"
                  quality={76}
                  variant="thumbnail"
                  className="size-14 rounded-[0.62rem] bg-muted/40 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                  iconClassName="size-4"
                />
                <div className="min-w-0">
                  <p className="truncate font-pixel text-[0.92rem] font-medium text-foreground/92">
                    {track.title}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground/66">
                    {track.artistName || "Unknown artist"}
                  </p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground/46">
                    {getDiscussionMeta(track)}
                  </p>
                </div>
              </PrefetchLink>
            ))}
          </div>
        </section>
      ) : null}

      {visibleAtlasTags.length > 0 ? (
        <section className="space-y-4" aria-labelledby="discover-atlas-title">
          <div className="flex items-center justify-between gap-4">
            <div id="discover-atlas-title">
              <SectionHeading>Atlas</SectionHeading>
            </div>
            <PrefetchLink
              href="/atlas"
              className="inline-flex min-h-8 items-center text-[12px] text-muted-foreground/64 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              View all
            </PrefetchLink>
          </div>

          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {visibleAtlasTags.map((tag) => (
              <PrefetchLink
                key={tag.id}
                href={`/atlas/${tag.slug}`}
                className="flex min-h-10 items-center rounded-[0.7rem] px-3 py-2 text-[13px] font-medium text-foreground/82 outline-none transition-colors duration-150 ease-out hover:bg-foreground/[0.035] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                <span className="truncate">{tag.label}</span>
              </PrefetchLink>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
