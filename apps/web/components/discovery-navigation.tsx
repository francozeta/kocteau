"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import EntityCoverImage from "@/components/entity-cover-image";
import PrefetchLink from "@/components/prefetch-link";
import { KocteauMoreIcon } from "@/components/kocteau-icons";
import { ComposeChevronLeftIcon } from "@/components/ui/icons";
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
  searchActive,
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
  searchActive: boolean;
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
  const desktopIdentityTarget = usePortalTarget("[data-kocteau-search-desktop-identity-slot]");
  const desktopFiltersTarget = usePortalTarget("[data-kocteau-search-desktop-filters-slot]");
  const desktopOptionsTarget = usePortalTarget("[data-kocteau-search-desktop-options-slot]");
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
      className="no-scrollbar flex min-w-0 items-center gap-0.5 overflow-x-auto"
    >
      {scopes.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={scope === option.value}
          onClick={() => {
            setOpen(false);
            onScopeChange(option.value);
          }}
          className="group flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={cn(
              "flex min-h-7 items-center rounded-full px-2.5 transition-colors duration-150",
              scope === option.value
                ? "bg-[var(--kocteau-surface-control-hover)] text-foreground"
                : "bg-[var(--kocteau-surface-control)] text-muted-foreground group-hover:text-foreground",
            )}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
  const identity = (
    <div className="flex min-h-14 min-w-0 items-center gap-1">
      {seed ? (
        <button
          type="button"
          aria-label={canGoBack ? "Previous canvas" : "Back to all music"}
          onClick={canGoBack ? onBack : onRestart}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ComposeChevronLeftIcon className="size-4" />
        </button>
      ) : null}
      {seed && href ? (
        <PrefetchLink
          href={href}
          data-discovery-focus
          data-selected-music-card
          aria-label={`Open ${typeLabels[seed.type].toLowerCase()}: ${seed.title}`}
          className="group flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-[var(--kocteau-surface-control)] py-1 ps-1 pe-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-lg:sr-only"
        >
          <EntityCoverImage
            src={seed.cover_url}
            alt=""
            sizes="24px"
            className={cn(
              "size-6 shrink-0 ring-1 ring-inset ring-white/10",
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
        </PrefetchLink>
      ) : (
        <h2
          data-discovery-focus
          tabIndex={-1}
          className="px-1 text-sm font-medium text-foreground max-lg:sr-only"
        >
          Search
        </h2>
      )}
      <span role="status" className="sr-only">
        {pending ? "Finding new paths…" : ""}
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
          <KocteauMoreIcon className="size-[1.125rem]" />
        </button>
      </Trigger>
      <Content className={mobile ? "px-4 pb-8" : "max-w-sm"}>
        <Header>
          <Title>Discovery</Title>
          <Description>Your exploration stays on this browser.</Description>
        </Header>
        <div className="grid gap-1">
          <div className="mb-2 hidden md:block lg:hidden">
            {scopeControls}
          </div>
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
                  <ComposeChevronLeftIcon className="size-[1.25rem]" />
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
    <>
      {desktopIdentityTarget
        ? createPortal(
            <nav aria-label="Discovery navigation" className="min-w-0">
              {identity}
            </nav>,
            desktopIdentityTarget,
          )
        : null}
      {desktopFiltersTarget && (!seed || searchActive)
        ? createPortal(scopeControls, desktopFiltersTarget)
        : null}
      {desktopOptionsTarget ? createPortal(options, desktopOptionsTarget) : null}
    </>
  );
}
