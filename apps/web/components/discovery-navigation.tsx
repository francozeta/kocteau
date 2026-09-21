"use client";

import { useState } from "react";
import PrefetchLink from "@/components/prefetch-link";
import { KocteauMoreIcon } from "@/components/kocteau-icons";
import { ComposeChevronLeftIcon, ExternalLink } from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DiscoverySeed } from "@/lib/discovery/seed";
import type { SearchScope } from "@/lib/search-types";
import { cn } from "@/lib/utils";

const scopes: { value: SearchScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "track", label: "Songs" },
  { value: "album", label: "Albums" },
  { value: "artist", label: "Artists" },
];
const typeLabels = { track: "Song", album: "Album", artist: "Artist" };
const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function DiscoveryNavigation({
  scope,
  onScopeChange,
  seed,
  href,
  pending,
  canGoBack,
  onBack,
  onRestart,
  onForget,
}: {
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  seed: DiscoverySeed | null;
  href?: string;
  pending: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onRestart: () => void;
  onForget: () => void;
}) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const Root = mobile ? Drawer : Dialog;
  const Trigger = mobile ? DrawerTrigger : DialogTrigger;
  const Content = mobile ? DrawerContent : DialogContent;
  const Header = mobile ? DrawerHeader : DialogHeader;
  const Title = mobile ? DrawerTitle : DialogTitle;
  const Description = mobile ? DrawerDescription : DialogDescription;

  return (
    <nav
      aria-label="Discovery navigation"
      className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-3 md:min-h-16 md:grid-cols-[minmax(0,1fr)_auto_auto] md:px-6"
    >
      <div
        role="group"
        aria-label="Search for"
        className="relative z-40 flex min-h-14 min-w-0 items-center gap-1 overflow-x-auto bg-black md:col-start-2 md:row-start-1 md:bg-[var(--kocteau-shell)]"
      >
        {scopes.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={scope === option.value}
            onClick={() => onScopeChange(option.value)}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-3 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              scope === option.value
                ? "bg-foreground/[0.075] font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="relative z-20 col-span-2 row-start-2 flex min-h-14 min-w-0 items-center gap-2 md:z-40 md:col-span-1 md:col-start-1 md:row-start-1">
        {canGoBack ? (
          <button
            type="button"
            aria-label="Previous canvas"
            onClick={onBack}
            className={iconButton}
          >
            <ComposeChevronLeftIcon className="size-4" />
          </button>
        ) : null}
        {seed && href ? (
          <PrefetchLink
            href={href}
            data-discovery-focus
            aria-label={`Open ${typeLabels[seed.type].toLowerCase()}: ${seed.title}`}
            className="group flex min-h-11 min-w-0 items-center gap-3 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block truncate text-[10px] text-muted-foreground">
                {[
                  typeLabels[seed.type],
                  seed.type !== "artist" ? seed.artist_name : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="mt-0.5 block truncate text-[13px] font-medium text-foreground">
                {seed.title}
              </span>
            </span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground/60 group-hover:text-foreground" />
          </PrefetchLink>
        ) : (
          <h2
            data-discovery-focus
            tabIndex={-1}
            className="px-1 text-sm font-medium text-foreground"
          >
            Explore
          </h2>
        )}
        <span role="status" className="ms-1 shrink-0">
          <span
            aria-hidden="true"
            className={cn(
              "block size-1 rounded-full bg-foreground/60",
              !pending && "invisible",
            )}
          />
          <span className="sr-only">{pending ? "Finding new paths…" : ""}</span>
        </span>
      </div>
      <Root open={open} onOpenChange={setOpen}>
        <Trigger asChild>
          <button
            type="button"
            aria-label="Canvas options"
            className={cn(
              iconButton,
              "relative z-40 col-start-2 row-start-1 bg-black md:col-start-3 md:bg-[var(--kocteau-shell)]",
            )}
          >
            <KocteauMoreIcon className="size-4" />
          </button>
        </Trigger>
        <Content className={mobile ? "px-4 pb-8" : "max-w-sm"}>
          <Header>
            <Title>Discovery</Title>
            <Description>Your exploration stays on this browser.</Description>
          </Header>
          <div className="grid gap-1">
            <button
              type="button"
              onClick={() => {
                onRestart();
                setOpen(false);
              }}
              className="min-h-11 rounded-lg px-3 text-start text-sm hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              New canvas
            </button>
            <button
              type="button"
              onClick={() => {
                onForget();
                setOpen(false);
              }}
              className="min-h-11 rounded-lg px-3 text-start text-sm text-muted-foreground hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear discovery memory
            </button>
          </div>
        </Content>
      </Root>
    </nav>
  );
}
