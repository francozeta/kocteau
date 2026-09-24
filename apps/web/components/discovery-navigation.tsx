"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import EntityCoverImage from "@/components/entity-cover-image";
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
import { usePortalTarget } from "@/hooks/use-portal-target";
import { shareUrl } from "@/lib/share";
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
  const headerTarget = usePortalTarget(
    "[data-kocteau-search-mobile-header-slot]",
  );
  const filtersTarget = usePortalTarget("[data-discovery-mobile-filters]");
  const Root = mobile ? Drawer : Dialog;
  const Trigger = mobile ? DrawerTrigger : DialogTrigger;
  const Content = mobile ? DrawerContent : DialogContent;
  const Header = mobile ? DrawerHeader : DialogHeader;
  const Title = mobile ? DrawerTitle : DialogTitle;
  const Description = mobile ? DrawerDescription : DialogDescription;

  const scopeControls = (
    <div
      role="group"
      aria-label="Search for"
      className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto"
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
              ? "font-medium text-foreground underline decoration-foreground/70 decoration-2 underline-offset-8 md:rounded-full md:bg-foreground/[0.075] md:no-underline"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
  const identity = (
    <div className="flex min-h-14 min-w-0 items-center gap-2">
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
          Search
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
  );
  const options = (
    <Root open={open} onOpenChange={setOpen}>
      <Trigger asChild>
        <button
          type="button"
          aria-label="Canvas options"
          className={iconButton}
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
          {seed && href ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void shareUrl({
                  title: [seed.title, seed.artist_name]
                    .filter(Boolean)
                    .join(" — "),
                  url: new URL(href, window.location.origin).toString(),
                  successMessage: "Link copied",
                  errorMessage: "We could not share this music. Try again.",
                });
              }}
              className="min-h-11 rounded-lg px-3 text-start text-sm hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Share {typeLabels[seed.type].toLowerCase()}
            </button>
          ) : null}
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
  );

  if (mobile) {
    return (
      <>
        {seed && href && headerTarget
          ? createPortal(
              <nav
                aria-label="Selected music"
                className="grid h-11 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2"
              >
                <button
                  type="button"
                  aria-label="Back to all music"
                  className={iconButton}
                  onClick={() => {
                    onRestart();
                    requestAnimationFrame(() =>
                      document
                        .querySelector<HTMLButtonElement>(
                          '[aria-label="Toggle navigation"]',
                        )
                        ?.focus(),
                    );
                  }}
                >
                  <ComposeChevronLeftIcon className="size-5" />
                </button>
                <PrefetchLink
                  href={href}
                  data-discovery-focus
                  aria-label={`Open ${typeLabels[seed.type].toLowerCase()}: ${seed.title}`}
                  className="mx-auto flex min-h-11 w-full max-w-72 min-w-0 items-center gap-2.5 rounded-full bg-[var(--kocteau-surface-control)] py-1.5 ps-1.5 pe-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <EntityCoverImage
                    src={seed.cover_url}
                    alt=""
                    sizes="32px"
                    className={cn(
                      "size-8 shrink-0 ring-1 ring-inset ring-white/10",
                      seed.type === "artist" ? "rounded-full" : "rounded-lg",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {seed.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {seed.type === "artist"
                        ? "Artist"
                        : seed.artist_name || typeLabels[seed.type]}
                    </span>
                  </span>
                  <span role="status" className="sr-only">
                    {pending ? "Finding new paths…" : ""}
                  </span>
                </PrefetchLink>
                {options}
              </nav>,
              headerTarget,
            )
          : null}
        {filtersTarget
          ? createPortal(
              <nav
                aria-label="Search filters"
                className="flex items-center justify-between gap-1"
              >
                {scopeControls}
                {!seed ? options : null}
              </nav>,
              filtersTarget,
            )
          : null}
      </>
    );
  }

  return (
    <nav
      aria-label="Discovery navigation"
      className="relative z-40 hidden min-h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-6 md:grid"
    >
      {identity}
      {scopeControls}
      {options}
    </nav>
  );
}
