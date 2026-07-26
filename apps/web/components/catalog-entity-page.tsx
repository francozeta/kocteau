import EntityCoverImage from "@/components/entity-cover-image";
import TrackTile from "@/components/track-tile";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";

export type CatalogShelfItem = {
  provider: "deezer";
  providerId: string;
  type: "track" | "album";
  title: string;
  artistName: string | null;
  coverUrl: string | null;
  entityId?: string | null;
};

type CatalogEntityPageProps = {
  kind: "Album" | "Artist";
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  details?: Array<string | null | undefined>;
  context?: string | null;
  shelves: Array<{
    title: string;
    items: CatalogShelfItem[];
  }>;
};

export default function CatalogEntityPage({
  kind,
  title,
  subtitle,
  imageUrl,
  details = [],
  context,
  shelves,
}: CatalogEntityPageProps) {
  const visibleDetails = details.filter(Boolean);

  return (
    <section className="w-full max-w-6xl space-y-12 pb-12 sm:space-y-14">
      <header className="grid gap-6 border-b border-border/16 pb-8 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-end sm:gap-8">
        <EntityCoverImage
          src={imageUrl}
          alt={title}
          sizes="(min-width: 640px) 176px, 144px"
          variant="hero"
          priority
          className={
            kind === "Artist"
              ? "aspect-square w-36 rounded-full border border-border/18 bg-muted/16 sm:w-44"
              : "aspect-square w-36 rounded-xl border border-border/18 bg-muted/16 sm:w-44"
          }
          iconClassName="size-8"
        />

        <div className="min-w-0 space-y-3">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground/72">
            {kind}
          </p>
          <div className="space-y-1.5">
            <h1 className="text-balance font-pixel text-[clamp(1.9rem,5vw,3.6rem)] font-medium leading-[0.98] tracking-[-0.035em] text-foreground">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>

          {visibleDetails.length > 0 ? (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground/72">
              {visibleDetails.map((detail, index) => (
                <span key={`${detail}-${index}`} className="inline-flex items-center gap-2">
                  {index > 0 ? <span aria-hidden="true">·</span> : null}
                  {detail}
                </span>
              ))}
            </p>
          ) : null}

          {context ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {context}
            </p>
          ) : null}
        </div>
      </header>

      {shelves.map((shelf) =>
        shelf.items.length > 0 ? (
          <section key={shelf.title} className="space-y-4">
            <h2 className="font-pixel text-[1rem] font-semibold tracking-[-0.015em] text-foreground/92">
              {shelf.title}
            </h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {shelf.items.map((item) => (
                <TrackTile
                  key={`${item.type}:${item.providerId}`}
                  title={item.title}
                  artistName={item.artistName}
                  coverUrl={item.coverUrl}
                  href={buildEntityCanonicalPath({
                    id: item.entityId,
                    provider: item.provider,
                    provider_id: item.providerId,
                    type: item.type,
                    title: item.title,
                    artist_name: item.artistName,
                  })}
                  sizes="(min-width: 1280px) 150px, (min-width: 640px) 24vw, 44vw"
                />
              ))}
            </div>
          </section>
        ) : null,
      )}
    </section>
  );
}
