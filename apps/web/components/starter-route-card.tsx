import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import { getDiscoverySeedPath } from "@/lib/discovery/seed";
import type { StarterTrack } from "@/lib/starter";

type StarterRouteCardProps = {
  track: StarterTrack;
  priority?: boolean;
};

function getStarterTrackHref(track: StarterTrack) {
  return getDiscoverySeedPath({
    provider_id: track.provider_id,
    title: track.title,
    type: "track",
  });
}

export default function StarterRouteCard({
  track,
  priority = false,
}: StarterRouteCardProps) {
  return (
    <PrefetchLink
      href={getStarterTrackHref(track)}
      className="group block overflow-hidden rounded-[0.9rem] bg-[var(--kocteau-surface-control)] outline-none transition-[opacity,transform] duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.96]"
      aria-label={`Start a discovery route from ${track.title} by ${track.artist_name ?? "Unknown artist"}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <EntityCoverImage
          src={track.cover_url}
          alt=""
          sizes="(max-width: 640px) 82vw, 14rem"
          quality={84}
          variant="card"
          priority={priority}
          className="absolute inset-0 h-full w-full"
          imageClassName="outline outline-1 -outline-offset-1 outline-black/10 transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transition-none dark:outline-white/10"
          iconClassName="size-8"
        />
        <div className="absolute inset-x-0 bottom-0 bg-black/78 px-3 py-3 backdrop-blur-md">
          <p className="truncate font-pixel text-[12px] leading-tight text-white/94">
            {track.title}
          </p>
          <p className="mt-1 truncate text-[11px] leading-tight text-white/66">
            {track.artist_name ?? "Unknown artist"}
          </p>
        </div>
      </div>
    </PrefetchLink>
  );
}
