import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import { ArrowRight } from "@/components/ui/icons";
import type { AtlasTag } from "@/lib/queries/atlas";
import type { DiscoveryTrack } from "@/lib/queries/discovery";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";
import type { StarterTrack } from "@/lib/starter";
import { preferenceKindLabels } from "@/lib/taste";

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

function formatDiscussionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function getDiscussionMeta(track: DiscoveryTrack) {
  if (track.reviewCount <= 0) {
    return "Recently reviewed";
  }

  const reviewLabel = track.reviewCount === 1 ? "review" : "reviews";
  const rating = track.averageRating ? ` · ${track.averageRating}` : "";

  return `${track.reviewCount} ${reviewLabel}${rating}`;
}

function EditionHeading({
  index,
  label,
  title,
}: {
  index: string;
  label: string;
  title: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4">
      <span className="pt-0.5 font-pixel text-[0.68rem] font-medium tabular-nums text-muted-foreground/48">
        {index}
      </span>
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-muted-foreground/68">
          {label}
        </p>
        <h2 className="max-w-2xl text-balance font-pixel text-[1.35rem] font-medium leading-[1.08] tracking-[-0.025em] text-foreground sm:text-[1.65rem]">
          {title}
        </h2>
      </div>
    </div>
  );
}

function RotationFeature({ track }: { track: StarterTrack }) {
  const note = track.editorial_note?.trim() || track.prompt?.trim();

  return (
    <PrefetchLink
      href={getStarterTrackHref(track)}
      className="group grid min-w-0 gap-4 rounded-[var(--kocteau-radius-card)] bg-[var(--kocteau-surface)] p-3 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-[background-color,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-raised)] focus-visible:ring-2 focus-visible:ring-ring/35 active:scale-[0.99] sm:grid-cols-[minmax(9.5rem,12.5rem)_minmax(0,1fr)] sm:items-end"
    >
      <EntityCoverImage
        src={track.cover_url}
        alt={track.title}
        sizes="(max-width: 639px) calc(100vw - 5rem), 200px"
        quality={84}
        variant="card"
        priority
        className="aspect-square w-full rounded-[0.72rem] bg-muted/40 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:max-w-[12.5rem]"
        iconClassName="size-7"
      />

      <div className="min-w-0 space-y-4 px-0.5 pb-0.5 sm:pb-1">
        <div className="space-y-1">
          <p className="font-pixel text-[1.3rem] font-medium leading-tight tracking-[-0.02em] text-foreground sm:text-[1.55rem]">
            {track.title}
          </p>
          <p className="text-[13px] text-muted-foreground/82">
            {track.artist_name || "Unknown artist"}
          </p>
        </div>

        {note ? (
          <p className="line-clamp-3 max-w-md text-pretty text-[13px] leading-5 text-muted-foreground/72">
            {note}
          </p>
        ) : null}

        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground/86">
          Open track
          <ArrowRight className="size-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
        </span>
      </div>
    </PrefetchLink>
  );
}

function RotationTrack({ track }: { track: StarterTrack }) {
  return (
    <PrefetchLink
      href={getStarterTrackHref(track)}
      className="group grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3 outline-none transition-opacity duration-150 ease-out hover:opacity-75 focus-visible:rounded-[0.55rem] focus-visible:ring-2 focus-visible:ring-ring/35"
    >
      <EntityCoverImage
        src={track.cover_url}
        alt=""
        sizes="52px"
        quality={76}
        variant="thumbnail"
        className="size-[3.25rem] rounded-[0.58rem] bg-muted/40 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        iconClassName="size-4"
      />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground/92">
          {track.title}
        </p>
        <p className="truncate text-[12px] text-muted-foreground/66">
          {track.artist_name || "Unknown artist"}
        </p>
      </div>
      <ArrowRight className="size-3.5 text-muted-foreground/42 transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-foreground/74" />
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
  const visibleAtlasTags = atlasTags
    .filter((tag) => tag.starterPickCount > 0)
    .slice(0, 8);

  return (
    <div className="space-y-12 pb-10 sm:space-y-14 sm:pb-14" data-testid="discover-edition">
      {featuredTrack ? (
        <section className="space-y-5" aria-labelledby="discover-rotation-title">
          <div id="discover-rotation-title">
            <EditionHeading
              index="01"
              label="In rotation"
              title="One way into something new."
            />
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.72fr)] lg:items-stretch">
            <RotationFeature track={featuredTrack} />

            {rotationTracks.length > 0 ? (
              <div className="divide-y divide-border/14 px-1 lg:px-2">
                {rotationTracks.map((track) => (
                  <RotationTrack key={track.id} track={track} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {visibleDiscussedTracks.length > 0 ? (
        <section className="space-y-5" aria-labelledby="discover-discussed-title">
          <div id="discover-discussed-title">
            <EditionHeading
              index="02"
              label="Recently discussed"
              title="What stayed with listeners."
            />
          </div>

          <div className="grid border-t border-border/18 sm:grid-cols-2 sm:gap-x-7">
            {visibleDiscussedTracks.map((track, index) => (
              <PrefetchLink
                key={track.entityId}
                href={getDiscussedTrackHref(track)}
                queryWarmup={{ kind: "track", id: track.entityId }}
                className="group grid min-w-0 grid-cols-[1.75rem_3.5rem_minmax(0,1fr)] items-center gap-3 border-b border-border/18 py-3.5 outline-none transition-opacity duration-150 ease-out hover:opacity-75 focus-visible:rounded-[0.55rem] focus-visible:ring-2 focus-visible:ring-ring/35"
              >
                <span className="font-pixel text-[0.65rem] tabular-nums text-muted-foreground/42">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <EntityCoverImage
                  src={track.coverUrl}
                  alt=""
                  sizes="56px"
                  quality={76}
                  variant="thumbnail"
                  className="size-14 rounded-[0.62rem] bg-muted/40 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  iconClassName="size-4"
                />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-foreground/92">
                      {track.title}
                    </p>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/42">
                      {formatDiscussionDate(track.latestReviewAt)}
                    </span>
                  </div>
                  <p className="truncate text-[12px] text-muted-foreground/66">
                    {track.artistName || "Unknown artist"}
                  </p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground/48">
                    {getDiscussionMeta(track)}
                  </p>
                </div>
              </PrefetchLink>
            ))}
          </div>
        </section>
      ) : null}

      {visibleAtlasTags.length > 0 ? (
        <section className="space-y-5" aria-labelledby="discover-atlas-title">
          <div id="discover-atlas-title">
            <EditionHeading
              index="03"
              label="Atlas"
              title="Follow a sound, scene, or feeling."
            />
          </div>

          <div className="grid border-t border-border/18 sm:grid-cols-2 lg:grid-cols-4">
            {visibleAtlasTags.map((tag) => (
              <PrefetchLink
                key={tag.id}
                href={`/atlas/${tag.slug}`}
                className="group flex min-h-[4.6rem] items-center justify-between gap-4 border-b border-border/18 py-3.5 outline-none transition-opacity duration-150 ease-out hover:opacity-75 focus-visible:rounded-[0.55rem] focus-visible:ring-2 focus-visible:ring-ring/35 sm:odd:pr-4 sm:even:pl-4 lg:px-4 lg:first:pl-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground/90">
                    {tag.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/48">
                    {preferenceKindLabels[tag.kind]}
                  </p>
                </div>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/42 transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-foreground/74" />
              </PrefetchLink>
            ))}
          </div>

          <PrefetchLink
            href="/atlas"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/68 transition-colors duration-150 hover:text-foreground"
          >
            Browse the full Atlas
            <ArrowRight className="size-3.5" />
          </PrefetchLink>
        </section>
      ) : null}
    </div>
  );
}
