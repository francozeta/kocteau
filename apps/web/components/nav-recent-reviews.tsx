"use client";

import { ChevronRight } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type RecentReviewItem = {
  entityId: string;
  title: string;
  artistName: string | null;
  coverUrl: string | null;
};

export function NavRecentReviews({
  items,
  onNavigate,
}: {
  items: RecentReviewItem[];
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
            <SidebarMenu className="gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.entityId}>
                  <SidebarMenuButton
                    asChild
                    className="h-11 rounded-xl px-2 text-[13px] font-medium"
                  >
                    <PrefetchLink
                      href={`/track/${item.entityId}`}
                      queryWarmup={{ kind: "track", id: item.entityId }}
                      onClick={onNavigate}
                    >
                      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-sidebar-border bg-sidebar-accent">
                        {item.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <span className="truncate">
                        {item.title}
                        {item.artistName ? (
                          <span className="text-muted-foreground"> — {item.artistName}</span>
                        ) : null}
                      </span>
                    </PrefetchLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
