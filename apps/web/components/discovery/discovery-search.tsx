"use client";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import EntityCoverImage from "@/components/music/entity-cover-image";
import { KocteauSearchIcon } from "@/components/icons/kocteau-icons";
import { Input } from "@/components/ui/input";
import { XIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { KocteauSearchResult } from "@/hooks/use-kocteau-search";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePortalTarget } from "@/hooks/use-portal-target";
import { cn } from "@/lib/utils";
import type { SearchScope } from "@/lib/search-types";
import DiscoveryResultList from "./discovery-result-list";
import styles from "./discovery-interface.module.css";

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
  onQueryChange: (query: string) => void;
  onSubmit: () => boolean;
  onSelect: (result: KocteauSearchResult) => boolean;
  onRetry: () => void;
  onFocusChange?: (focused: boolean) => void;
  hasError: boolean;
  mobile?: boolean;
};

export default function DiscoverySearch({
  actions,
  scope,
  query,
  results,
  isSearching,
  onQueryChange,
  onSubmit,
  onSelect,
  onRetry,
  onFocusChange,
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
  const inputPortalTarget = usePortalTarget(
    mobile ? "#mobile-search-dock" : "[data-kocteau-search-header-slot]",
  );
  const resultsPortalTarget = usePortalTarget(
    "[data-kocteau-search-results-surface]",
  );
  const desktopActionsTarget = usePortalTarget(
    "[data-kocteau-search-desktop-actions-slot]",
  );
  const hasQuery = query.trim().length >= 2;
  const isActiveViewport = mobile === isMobileViewport;
  const showResults =
    isActiveViewport &&
    (isFocused || query.length > 0) &&
    (mobile ? hasQuery : true);
  const showClose = isFocused || query.length > 0;
  const resultListId = mobile
    ? "mobile-discovery-seed-results"
    : "discovery-seed-results";
  const inputId = mobile
    ? "mobile-discovery-seed-search"
    : "discovery-seed-search";

  useEffect(() => () => onFocusChange?.(false), [onFocusChange]);

  const closeSearch = (restoreFocus = true) => {
    onQueryChange("");
    inputRef.current?.blur();
    setIsFocused(false);
    onFocusChange?.(false);
    if (restoreFocus) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            "[data-discovery-focus], [data-global-search-trigger]",
          )
          ?.focus({ preventScroll: true }),
      );
    }
  };

  const submitSearch = () => {
    if (!onSubmit()) {
      return;
    }

    inputRef.current?.blur();
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const resultList = showResults ? (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeSearch();
          return;
        }
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
              "[data-search-result]",
            ),
          );
          const index = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          if (index < 0) return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : index + (event.key === "ArrowDown" ? 1 : -1);
          if (next < 0) inputRef.current?.focus();
          else buttons[Math.min(next, buttons.length - 1)]?.focus();
        }
      }}
      className={styles.resultsPanel}
      role="region"
      aria-label="Music search results"
    >
      <div className="flex items-baseline justify-between gap-4 px-5 pb-3 pt-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Music index
          </p>
          <h3 className="mt-1.5 font-pixel text-base font-medium text-foreground">
            {hasQuery ? "Choose a starting point." : "Where do we go next?"}
          </h3>
        </div>
        {hasQuery ? (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {isSearching ? "Searching…" : `${results.length} found`}
          </span>
        ) : null}
      </div>
      <DiscoveryResultList id={resultListId}>
        {!hasQuery ? (
          <p className="px-3 pb-5 text-sm leading-6 text-muted-foreground">
            Find a song, album, or artist. Let one lead to another.
          </p>
        ) : null}
        {!hasQuery ? null : isSearching && results.length === 0 ? (
          <div
            role="group"
            aria-busy="true"
            aria-label="Searching the catalog"
            className="grid gap-1"
          >
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} aria-hidden="true" className={styles.resultRow}>
                <Skeleton className="size-11 animate-none rounded-md bg-muted-foreground/[0.1]" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-[min(14rem,62%)] animate-none rounded-full bg-muted-foreground/[0.12]" />
                  <Skeleton className="h-2.5 w-[min(9rem,42%)] animate-none rounded-full bg-muted-foreground/[0.08]" />
                </div>
                <Skeleton className="h-2 w-10 animate-none justify-self-end rounded-full bg-muted-foreground/[0.08]" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-1">
            {results.map((result) => (
              <button
                type="button"
                data-search-result
                key={`${result.provider}:${result.type}:${result.provider_id}`}
                aria-label={`${result.title}${result.artist_name ? ` by ${result.artist_name}` : ""} — ${getResultTypeLabel(result)}`}
                onClick={() => {
                  if (onSelect(result)) closeSearch(false);
                }}
                className={styles.resultRow}
              >
                <EntityCoverImage
                  src={result.cover_url}
                  alt=""
                  sizes="44px"
                  quality={70}
                  variant="thumbnail"
                  className={cn(
                    "size-11 bg-muted/30 outline-1 -outline-offset-1 outline-white/10",
                    result.type === "artist" ? "rounded-full" : "rounded-md",
                  )}
                  iconClassName="size-3.5"
                />
                <span className="min-w-0">
                  <span className="block line-clamp-2 break-words font-pixel text-[13px] font-medium leading-5 text-foreground">
                    {result.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {getResultMetadataLabel(result)}
                  </span>
                </span>
                <span className="pr-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  {getResultTypeLabel(result)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            <p
              id={`${resultListId}-error`}
              role={hasError ? "alert" : undefined}
            >
              {hasError
                ? "Search couldn’t load. Your canvas is still here."
                : "No matches. Try another name."}
            </p>
            {hasError ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 min-h-11 rounded-lg px-3 text-foreground hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Retry search
              </button>
            ) : null}
          </div>
        )}
      </DiscoveryResultList>
      <p className="hidden px-5 py-3 text-xs text-muted-foreground md:block">
        ↑↓ to browse <span className="mx-2 text-foreground/20">/</span> Enter to
        explore <span className="mx-2 text-foreground/20">/</span> Esc to close
      </p>
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
        "grid min-w-0 items-center",
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
          type="search"
          enterKeyHint="search"
          data-global-search-input="true"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={() => {
            setIsFocused(true);
            onFocusChange?.(true);
          }}
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
          aria-describedby={
            hasError && results.length === 0 && showResults
              ? `${resultListId}-error`
              : undefined
          }
          aria-controls={
            showResults && resultsPortalTarget ? resultListId : undefined
          }
          className="h-11 rounded-[0.625rem] border-transparent bg-[var(--kocteau-surface-control)] pl-10 pr-4 text-base shadow-none placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-foreground md:h-9 md:text-[13px] [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="sr-only" role="status" aria-live="polite">
          {hasError
            ? "Search couldn’t load. Retry search to try again."
            : hasQuery && (!isSearching || results.length > 0)
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
          onClick={() => closeSearch()}
          className={cn(
            "flex size-11 items-center justify-center rounded-[0.625rem] bg-[var(--kocteau-surface-control)] text-foreground motion-safe:transition-transform motion-safe:duration-150 hover:bg-[var(--kocteau-surface-control-hover)] motion-safe:active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground md:size-10",
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
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-[var(--kocteau-surface-control)] ring-1 ring-inset ring-white/[0.08]">
            <KocteauSearchIcon className="size-[1.125rem]" />
          </span>
        </button>
      </div>
    ) : (
      <div className="grid gap-1">
        {mobile ? <div data-discovery-mobile-filters /> : null}
        {searchForm}
      </div>
    );

  return (
    <>
      {createPortal(dock, inputPortalTarget)}
      {portaledResultList}
      {!mobile && showActions && desktopActionsTarget
        ? createPortal(actions, desktopActionsTarget)
        : null}
    </>
  );
}
