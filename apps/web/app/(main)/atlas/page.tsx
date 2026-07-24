import type { Metadata } from "next";
import PrefetchLink from "@/components/prefetch-link";
import { ArrowRight } from "@/components/ui/icons";
import { createPageMetadata } from "@/lib/metadata";
import { getAtlasTags, type AtlasTag } from "@/lib/queries/atlas";
import {
  groupPreferenceTags,
  preferenceKindDescriptions,
  preferenceKindLabels,
  preferenceKindOrder,
} from "@/lib/taste";
import { cn } from "@/lib/utils";

export const revalidate = 1800;

export const metadata: Metadata = createPageMetadata({
  title: "Atlas",
  description:
    "Explore Kocteau music taste vocabulary through genres, moods, scenes, styles, eras, and formats.",
  path: "/atlas",
});

function AtlasTagLink({ tag }: { tag: AtlasTag }) {
  const hasStarterPicks = tag.starterPickCount > 0;

  return (
    <PrefetchLink
      href={`/atlas/${tag.slug}`}
      className={cn(
        "group inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-medium leading-none transition-[background-color,color,opacity] duration-150 ease-[var(--kocteau-ease)]",
        hasStarterPicks
          ? "bg-[var(--kocteau-surface-control)] text-foreground hover:bg-[var(--kocteau-surface-control-hover)]"
          : "bg-foreground/[0.035] text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground/82",
      )}
    >
      <span>{tag.label}</span>
      {hasStarterPicks ? (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-foreground/38 transition-colors group-hover:bg-foreground/55"
        />
      ) : null}
    </PrefetchLink>
  );
}

export default async function AtlasPage() {
  const tags = await getAtlasTags();
  const groupedTags = groupPreferenceTags(tags);
  const featuredTags = tags
    .filter((tag) => tag.is_featured && tag.starterPickCount > 0)
    .slice(0, 12);

  return (
    <section className="flex w-full max-w-5xl flex-col gap-8 pb-16 lg:max-w-none">
      <header className="border-b border-border/22 pb-6 sm:pb-7">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Atlas</p>
          <h1 className="text-balance font-heading text-4xl font-medium tracking-normal text-foreground sm:text-5xl">
            Start with a sound, a room, or a feeling.
          </h1>
          <p className="max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
            Kocteau Atlas is a public map of the signals behind discovery:
            genres, moods, scenes, styles, eras, and listening formats that
            point toward something worth hearing next.
          </p>
        </div>
      </header>

      {featuredTags.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-foreground">
              Starter-backed signals
            </h2>
            <PrefetchLink
              href="/search"
              className="group hidden items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Explore tracks
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </PrefetchLink>
          </div>
          <div className="scroll-mask-x no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {featuredTags.map((tag) => (
              <AtlasTagLink key={tag.id} tag={tag} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="divide-y divide-border/18">
        {preferenceKindOrder.map((kind) => {
          const kindTags = groupedTags.get(kind) ?? [];

          if (kindTags.length === 0) {
            return null;
          }

          return (
            <section
              key={kind}
              className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)] sm:gap-8"
            >
              <div className="space-y-1.5">
                <h2 className="text-base font-semibold text-foreground">
                  {preferenceKindLabels[kind]}
                </h2>
                <p className="text-pretty text-xs leading-5 text-muted-foreground">
                  {preferenceKindDescriptions[kind]}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {kindTags.map((tag) => (
                  <AtlasTagLink key={tag.id} tag={tag} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
