"use client";

import { ChevronRight } from "lucide-react";
import PrefetchLink from "@/components/prefetch-link";
import UserAvatar from "@/components/user-avatar";
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

type ActiveUserItem = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  latest_track_title: string | null;
  latest_track_artist_name: string | null;
  review_count: number;
};

function formatReviewCount(count: number) {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}

export function NavActiveUsers({
  items,
  onNavigate,
}: {
  items: ActiveUserItem[];
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
            Active Reviewers
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <SidebarGroupAction asChild className="top-2.5">
          <CollapsibleTrigger>
            <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            <span className="sr-only">Toggle active reviewers</span>
          </CollapsibleTrigger>
        </SidebarGroupAction>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const primaryLabel = item.display_name ?? `@${item.username}`;
                const latestTrackLabel = [item.latest_track_title, item.latest_track_artist_name]
                  .filter(Boolean)
                  .join(" — ");

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      className="h-auto rounded-xl px-2 py-2.5 text-[13px] font-medium"
                    >
                      <PrefetchLink href={`/u/${item.username}`} onClick={onNavigate}>
                        <div className="flex min-w-0 items-start gap-3">
                          <UserAvatar
                            avatarUrl={item.avatar_url}
                            displayName={item.display_name}
                            username={item.username}
                            className="size-9 shrink-0"
                            initialsLength={2}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                                  {primaryLabel}
                                </p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  @{item.username}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full border border-sidebar-border/70 bg-sidebar-accent/55 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {formatReviewCount(item.review_count)}
                              </span>
                            </div>

                            {latestTrackLabel ? (
                              <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                                Latest on {latestTrackLabel}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </PrefetchLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
