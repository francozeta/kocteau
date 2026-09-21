"use client";
import {
  type KeyboardEvent,
  type ReactNode,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import EntityCoverImage from "@/components/entity-cover-image";
import { KocteauSearchIcon } from "@/components/kocteau-icons";
import { Input } from "@/components/ui/input";
import { XIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { KocteauSearchResult } from "@/hooks/use-kocteau-search";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { SearchScope } from "@/lib/search-types";

function subscribeToPortalTargets(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);

  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

function getMobileSearchDockSnapshot() {
  return document.getElementById("mobile-search-dock");
}

function getMobileSearchDockServerSnapshot() {
  return null;
}

function getSearchResultsTargetSnapshot() {
  return document.querySelector<HTMLElement>(
    "[data-kocteau-search-results-surface]",
  );
}

function getDesktopSearchInputTargetSnapshot() {
  return document.querySelector<HTMLElement>(
    "[data-kocteau-search-header-slot]",
  );
}

function getResultTypeLabel(result: KocteauSearchResult) {
  if (result.type === "artist") return result.artist_type || "Artist";
  if (result.type === "album") return result.album_record_type || "Album";
  return "Song";
}

function getResultMetadataLabel(result: KocteauSearchResult) {
  if (result.type === "artist") {
    return result.disambiguation || "Artist";
  }

  if (result.type === "album") {
    return [result.artist_name, result.album_record_type || "Album"]
      .filter(Boolean)
      .join(" · ");
  }

  return result.artist_name || "Unknown artist";
}

type DiscoverySearchProps = {
  actions?: ReactNode;
  scope: SearchScope;
  query: string;
  results: KocteauSearchResult[];
  isSearching: boolean;
  isExpanding: boolean;
  onQueryChange: (query: string) => void;
  onSubmit: () => boolean;
  onSelect: (result: KocteauSearchResult) => void;
  hasError: boolean;
  mobile?: boolean;
};

export default function DiscoverySearch({
  actions,
  scope,
  query,
  results,
  isSearching,
  isExpanding,
  onQueryChange,
  onSubmit,
  onSelect,
  hasError,
  mobile = false,
}: DiscoverySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchLabel =
    scope === "all"
      ? "Search a song, album, or artist"
      : `Search ${scope === "track" ? "songs" : `${scope}s`}`;
  const [isFocused, setIsFocused] = useState(Boolean(query));
  const isMobileViewport = useIsMobile();
  const inputPortalTarget = useSyncExternalStore(
    subscribeToPortalTargets,
    mobile ? getMobileSearchDockSnapshot : getDesktopSearchInputTargetSnapshot,
    getMobileSearchDockServerSnapshot,
  );
  const resultsPortalTarget = useSyncExternalStore(
    subscribeToPortalTargets,
    getSearchResultsTargetSnapshot,
    getMobileSearchDockServerSnapshot,
  );
  const hasQuery = query.trim().length >= 2;
  const isActiveViewport = mobile === isMobileViewport;
  const showResults = isActiveViewport && isFocused && hasQuery;
  const showClose = isFocused || query.length > 0;
  const resultListId = mobile
    ? "mobile-discovery-seed-results"
    : "discovery-seed-results";
  const inputId = mobile
    ? "mobile-discovery-seed-search"
    : "discovery-seed-search";

  const closeSearch = () => {
    onQueryChange("");
    inputRef.current?.blur();
    setIsFocused(false);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>("[data-global-search-trigger]")
        ?.focus(),
    );
  };

  const submitSearch = () => {
    if (!onSubmit()) {
      return;
    }

    inputRef.current?.blur();
    setIsFocused(false);
  };

  const resultList = showResults ? (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          closeSearch();
          inputRef.current?.focus();
        }
      }}
      className={cn(
        "absolute inset-0 z-40 overflow-y-auto overscroll-contain",
        mobile
          ? "bg-black px-3 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-3 sm:px-6"
          : "bg-[var(--kocteau-shell)] px-6 pb-8 pt-5",
      )}
    >
      <div id={resultListId} className="mx-auto w-full max-w-2xl">
        {isSearching ? (
          <div
            aria-busy="true"
            aria-label="Searching the catalog"
            className="grid gap-1"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="grid min-h-16 grid-cols-[3.25rem_minmax(0,1fr)_3rem] items-center gap-3 px-2 py-1.5"
              >
                <Skeleton className="size-[3.25rem] rounded-[0.6rem] bg-muted-foreground/[0.1]" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-[min(14rem,62%)] rounded-full bg-muted-foreground/[0.12]" />
                  <Skeleton className="h-2.5 w-[min(9rem,42%)] rounded-full bg-muted-foreground/[0.08]" />
                </div>
                <Skeleton className="h-2 w-10 justify-self-end rounded-full bg-muted-foreground/[0.08]" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-1">
            {results.map((result) => (
              <button
                type="button"
                key={`${result.provider}:${result.type}:${result.provider_id}`}
                onClick={() => {
                  onSelect(result);
                  closeSearch();
                }}
                className="grid min-h-16 min-w-0 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[0.75rem] px-2 py-1.5 text-left outline-none transition-colors duration-150 hover:bg-foreground/[0.055] focus-visible:ring-2 focus-visible:ring-ring/55"
              >
                <EntityCoverImage
                  src={result.cover_url}
                  alt=""
                  sizes="52px"
                  quality={70}
                  variant="thumbnail"
                  className={cn(
                    "size-[3.25rem] bg-muted/30",
                    result.type === "artist"
                      ? "rounded-full"
                      : "rounded-[0.6rem]",
                  )}
                  iconClassName="size-3.5"
                />
                <span className="min-w-0">
                  <span className="block truncate font-pixel text-[12px] font-medium text-foreground/92">
                    {result.title}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-muted-foreground/62">
                    {getResultMetadataLabel(result)}
                  </span>
                </span>
                <span className="pr-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/48">
                  {getResultTypeLabel(result)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-3 py-4 text-[11px] text-muted-foreground/58">
            {hasError
              ? "Search is unavailable. Try again shortly."
              : "No matches. Try another name."}
          </p>
        )}
      </div>
    </div>
  ) : null;
  const portaledResultList =
    resultList && resultsPortalTarget
      ? createPortal(resultList, resultsPortalTarget)
      : null;

  if (!isActiveViewport || !inputPortalTarget) {
    return portaledResultList;
  }

  const searchForm = (
    <form
      className={cn(
        "grid min-w-0 items-center transition-[grid-template-columns,gap] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
        showClose
          ? "grid-cols-[minmax(0,1fr)_2.75rem] gap-3"
          : "grid-cols-[minmax(0,1fr)_0fr] gap-0",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
      role="search"
    >
      <div className="relative min-w-0">
        <label htmlFor={inputId} className="sr-only">
          {searchLabel}
        </label>
        <KocteauSearchIcon className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[1.05rem] -translate-y-1/2 text-muted-foreground/62" />
        <Input
          ref={inputRef}
          id={inputId}
          name="q"
          data-global-search-input="true"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "ArrowDown" && showResults) {
              event.preventDefault();
              document
                .getElementById(resultListId)
                ?.querySelector<HTMLButtonElement>("button")
                ?.focus();
              return;
            }
            if (event.key !== "Escape") return;

            event.preventDefault();
            closeSearch();
          }}
          placeholder={`${searchLabel}…`}
          autoComplete="off"
          maxLength={80}
          aria-expanded={showResults}
          aria-controls={resultListId}
          className="h-11 rounded-full border-transparent bg-[var(--kocteau-surface-control)] pl-10 pr-4 text-base shadow-none placeholder:text-muted-foreground/58 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring/70 md:text-[13px]"
        />
        {isExpanding ? (
          <span
            className="pointer-events-none absolute right-3.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-foreground/60 motion-safe:animate-pulse"
            aria-hidden="true"
          />
        ) : null}
        <span className="sr-only" role="status" aria-live="polite">
          {hasQuery && !isSearching
            ? `${results.length} search results available.`
            : ""}
        </span>
      </div>

      <div className="overflow-hidden">
        <button
          type="button"
          aria-label="Close search"
          aria-hidden={!showClose}
          tabIndex={showClose ? 0 : -1}
          onPointerDown={(event) => event.preventDefault()}
          onClick={closeSearch}
          className={cn(
            "flex size-11 items-center justify-center rounded-full bg-[var(--kocteau-surface-control)] text-foreground transition-[opacity,scale,background-color] duration-150 hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
            showClose
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0",
          )}
        >
          <XIcon className="size-5" />
        </button>
      </div>
    </form>
  );

  const showActions = Boolean(actions) && !isFocused && !query;
  const dock =
    mobile && showActions ? (
      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          aria-label="Search music"
          data-global-search-trigger
          onClick={() => {
            setIsFocused(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--kocteau-surface-control)] text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <KocteauSearchIcon className="size-4" />
        </button>
      </div>
    ) : (
      searchForm
    );

  return (
    <>
      {createPortal(dock, inputPortalTarget)}
      {portaledResultList}
      {!mobile && showActions ? (
        <div className="absolute bottom-5 left-1/2 z-20 flex w-72 -translate-x-1/2">
          {actions}
        </div>
      ) : null}
    </>
  );
}
