"use client";

import { ChevronRight, MoreHorizontal, Pin, Star } from "lucide-react";
import type { EditReviewSelection } from "@/components/edit-review-dialog";
import PrefetchLink from "@/components/prefetch-link";
import ReviewActionsMenu from "@/components/review-card-actions-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type OwnedReviewItem = {
  id: string;
  title: string | null;
  body: string | null;
  rating: number;
  is_pinned?: boolean;
  entity: EditReviewSelection;
};

function getReviewSummary(item: OwnedReviewItem) {
  if (item.title?.trim()) {
    return item.title.trim();
  }

  if (item.body?.trim()) {
    return item.body.trim();
  }

  return "Rating only";
}

function OwnedReviewRailItem({
  item,
  onNavigate,
}: {
  item: OwnedReviewItem;
  onNavigate?: () => void;
}) {
  const reviewSummary = getReviewSummary(item);

  return (
    <SidebarMenuItem>
      <div className="flex items-start gap-1 rounded-[1.05rem] border border-sidebar-border/46 bg-sidebar-accent/22 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-sidebar-border/30 md:bg-sidebar-accent/10">
        <PrefetchLink
          href={`/track/${item.entity.entity_id}#review-${item.id}`}
          queryWarmup={{ kind: "track", id: item.entity.entity_id }}
          onClick={onNavigate}
          className="group min-w-0 flex-1 rounded-lg"
        >
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] bg-sidebar-accent/38 md:bg-sidebar-accent/30">
              {item.entity.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.entity.cover_url}
                  alt={item.entity.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-sidebar-foreground">
                    {item.entity.title}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.entity.artist_name ?? "Unknown artist"}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground">
                  <Star className="size-3 fill-current text-amber-400" />
                  {item.rating.toFixed(1)}
                </span>
              </div>

              <div className="mt-1 flex min-w-0 items-center gap-1.5">
                {item.is_pinned ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/90">
                    <Pin className="size-3" />
                    Pinned
                  </span>
                ) : null}

                <p className="line-clamp-1 text-[11px] text-muted-foreground/90">
                  {reviewSummary}
                </p>
              </div>
            </div>
          </div>
        </PrefetchLink>

        <ReviewActionsMenu
          reviewId={item.id}
          reviewTitle={item.title}
          entityTitle={item.entity.title}
          entityId={item.entity.entity_id}
          canManage
          editSeed={{
            initialSelection: item.entity,
            initialTitle: item.title ?? "",
            initialBody: item.body ?? "",
            initialRating: item.rating,
            initialPinned: Boolean(item.is_pinned),
          }}
          trigger={
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:bg-sidebar-accent/42 hover:text-sidebar-foreground md:hover:bg-sidebar-accent/35"
              aria-label="Review options"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          }
        />
      </div>
    </SidebarMenuItem>
  );
}

export function NavOwnedReviews({
  items,
  onNavigate,
}: {
  items: OwnedReviewItem[];
  onNavigate?: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup className="px-0 group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="cursor-pointer">
            Recent Reviews
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <SidebarGroupAction asChild className="top-2.5">
          <CollapsibleTrigger>
            <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            <span className="sr-only">Toggle recent reviews</span>
          </CollapsibleTrigger>
        </SidebarGroupAction>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => (
                <OwnedReviewRailItem key={item.id} item={item} onNavigate={onNavigate} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
