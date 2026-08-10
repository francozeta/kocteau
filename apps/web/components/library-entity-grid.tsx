import type { ReactNode } from "react";
import TrackTile from "@/components/track-tile";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export type LibraryGridItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
};

export default function LibraryEntityGrid({
  items,
  emptyTitle,
  emptyDescription,
  emptyIcon,
}: {
  items: LibraryGridItem[];
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: ReactNode;
}) {
  if (items.length === 0) {
    return (
      <Empty className="rounded-[1.35rem] border-border/22 bg-card/14 px-6 py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <TrackTile
          key={item.id}
          href={item.href}
          title={item.title}
          artistName={item.subtitle}
          coverUrl={item.coverUrl}
          sizes="(min-width: 1024px) 156px, (min-width: 640px) 28vw, 46vw"
          quality={86}
          coverClassName="rounded-[0.68rem]"
        />
      ))}
    </div>
  );
}
