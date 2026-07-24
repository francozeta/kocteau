import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import { ArrowLeft, ArrowRight, Music2 } from "@/components/ui/icons";
import { createPageMetadata } from "@/lib/metadata";
import {
  getAtlasTagPage,
  type AtlasStarterPick,
  type AtlasTag,
} from "@/lib/queries/atlas";
import { buildEntityCanonicalPath } from "@/lib/seo-routes";
import { preferenceKindLabels } from "@/lib/taste";

export const revalidate = 1800;

type AtlasTagRouteProps = {
  params: Promise<{ slug: string }>;
};

type IntentLane = {
  label: string;
  description: string;
  href: string;
};

export async function generateMetadata({
  params,
}: AtlasTagRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const atlasPage = await getAtlasTagPage(slug);

  if (!atlasPage) {
    return createPageMetadata({
      title: "Atlas",
      description: "Explore Kocteau's taste signals.",
      path: `/atlas/${slug}`,
      noIndex: true,
    });
  }

  const description =
    atlasPage.tag.description ??
    `Explore ${atlasPage.tag.label} through Kocteau starter picks and nearby taste signals.`;

  return createPageMetadata({
    title: `${atlasPage.tag.label} Atlas`,
    description,
    path: `/atlas/${atlasPage.tag.slug}`,
  });
}

function buildIntentLanes(tag: AtlasTag, relatedTags: AtlasTag[]): IntentLane[] {
  const sameKind = relatedTags.find((item) => item.kind === tag.kind);
  const otherKind = relatedTags.find((item) => item.kind !== tag.kind);
  const deeper = relatedTags.find(
    (item) => item.starterPickCount > 0 && item.id !== sameKind?.id,
  );

  return [
    {
      label: "Continue",
      description: sameKind
        ? `Stay close through ${sameKind.label}.`
        : `Stay close to ${tag.label}.`,
      href: sameKind ? `/atlas/${sameKind.slug}` : `/search?q=${encodeURIComponent(tag.label)}`,
    },
    {
      label: "Go deeper",
      description: deeper
        ? `Use ${deeper.label} as the next shelf.`
        : "Open the starter shelf behind this signal.",
      href: deeper ? `/atlas/${deeper.slug}` : `/search?q=${encodeURIComponent(tag.label)}`,
    },
    {
      label: "Take a stranger path",
      description: otherKind
        ? `Keep one thread and move toward ${otherKind.label}.`
        : "Move outward from this signal into Kocteau's wider map.",
      href: otherKind ? `/atlas/${otherKind.slug}` : "/atlas",
    },
  ];
}

function StarterPickRow({ pick }: { pick: AtlasStarterPick }) {
  const trackPath = buildEntityCanonicalPath({
    provider: pick.provider,
    provider_id: pick.provider_id,
    type: pick.type,
    title: pick.title,
    artist_name: pick.artist_name,
  });
  const supportingCopy = pick.prompt ?? pick.editorial_note;

  return (
    <PrefetchLink
      href={trackPath}
      className="group grid min-h-[5.75rem] grid-cols-[4.4rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[1rem] bg-[var(--kocteau-surface)] px-3 py-3 shadow-[var(--kocteau-shadow-card)] transition-[background-color,box-shadow] duration-150 ease-[var(--kocteau-ease)] hover:bg-[var(--kocteau-surface-raised)] hover:shadow-[var(--kocteau-shadow-card-hover)] sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-4"
    >
      <EntityCoverImage
        src={pick.cover_url}
        alt={pick.title}
        sizes="80px"
        quality={70}
        className="size-16 rounded-[0.78rem] bg-muted sm:size-18"
        iconClassName="size-5"
      />

      <div className="min-w-0 space-y-1">
        <h2 className="line-clamp-1 text-sm font-semibold text-foreground sm:text-base">
          {pick.title}
        </h2>
        <p className="line-clamp-1 text-xs text-muted-foreground sm:text-sm">
          {pick.artist_name ?? "Unknown artist"}
        </p>
        {supportingCopy ? (
          <p className="line-clamp-1 max-w-2xl text-xs leading-5 text-muted-foreground/82">
            {supportingCopy}
          </p>
        ) : null}
      </div>

      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </PrefetchLink>
  );
}

function RelatedTagLink({ tag }: { tag: AtlasTag }) {
  return (
    <PrefetchLink
      href={`/atlas/${tag.slug}`}
      className="inline-flex min-h-8 items-center gap-2 whitespace-nowrap rounded-full bg-[var(--kocteau-surface-control)] px-3 text-xs font-medium text-foreground/88 transition-colors hover:bg-[var(--kocteau-surface-control-hover)] hover:text-foreground"
    >
      <span className="text-muted-foreground">{preferenceKindLabels[tag.kind]}</span>
      <span>{tag.label}</span>
    </PrefetchLink>
  );
}

export default async function AtlasTagPage({ params }: AtlasTagRouteProps) {
  const { slug } = await params;
  const atlasPage = await getAtlasTagPage(slug);

  if (!atlasPage) {
    notFound();
  }

  const { tag, picks, relatedTags } = atlasPage;
  const intentLanes = buildIntentLanes(tag, relatedTags);

  return (
    <section className="flex w-full max-w-5xl flex-col gap-8 pb-16 lg:max-w-none">
      <header className="space-y-6 border-b border-border/22 pb-6">
        <PrefetchLink
          href="/atlas"
          className="group inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Atlas
        </PrefetchLink>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              {preferenceKindLabels[tag.kind]}
            </p>
            <h1 className="text-balance font-heading text-4xl font-medium tracking-normal text-foreground sm:text-5xl">
              {tag.label}
            </h1>
            <p className="max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
              {tag.description ??
                "A Kocteau taste signal for finding records through context, not only similarity."}
            </p>
          </div>

          <PrefetchLink
            href={`/search?q=${encodeURIComponent(tag.label)}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-[transform,background-color] duration-150 ease-[var(--kocteau-ease)] hover:bg-foreground/90 active:scale-[0.98]"
          >
            Find tracks
          </PrefetchLink>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Routes</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {intentLanes.map((lane) => (
            <PrefetchLink
              key={lane.label}
              href={lane.href}
              className="group min-h-[5.5rem] rounded-[1rem] bg-[var(--kocteau-surface)] p-4 shadow-[var(--kocteau-shadow-card)] transition-[background-color,box-shadow] duration-150 ease-[var(--kocteau-ease)] hover:bg-[var(--kocteau-surface-raised)] hover:shadow-[var(--kocteau-shadow-card-hover)]"
            >
              <span className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
                {lane.label}
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </span>
              <p className="mt-2 text-pretty text-xs leading-5 text-muted-foreground">
                {lane.description}
              </p>
            </PrefetchLink>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">Starter picks</h2>
          {picks.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              Curated from Studio
            </span>
          ) : null}
        </div>

        {picks.length > 0 ? (
          <div className="grid gap-2.5">
            {picks.map((pick) => (
              <StarterPickRow key={pick.id} pick={pick} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-36 flex-col items-center justify-center rounded-[1rem] bg-[var(--kocteau-surface)] px-6 py-8 text-center shadow-[var(--kocteau-shadow-card)]">
            <Music2 className="mb-3 size-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              No starter picks yet
            </h2>
            <p className="mt-1 max-w-sm text-pretty text-xs leading-5 text-muted-foreground">
              This signal is in the vocabulary, but it still needs an editorial
              shelf before it can guide discovery.
            </p>
          </div>
        )}
      </section>

      {relatedTags.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Nearby signals</h2>
          <div className="scroll-mask-x no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {relatedTags.map((relatedTag) => (
              <RelatedTagLink key={relatedTag.id} tag={relatedTag} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
