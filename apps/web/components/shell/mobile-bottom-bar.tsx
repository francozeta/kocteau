"use client";

import { useEffect, useState, type ComponentType, type CSSProperties, type SVGProps } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  KocteauChevronLeftMediumIcon,
  KocteauHomeIcon,
  KocteauLibraryIcon,
  KocteauReviewsIcon,
  KocteauSearchIcon,
} from "@/components/icons/kocteau-icons";
import { useRouteHeader } from "@/components/shell/route-header-context";
import UserAvatar from "@/components/profile/user-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const ReviewCommentDock = dynamic(
  () => import("@/components/reviews/review-comment-dock"),
  {
    ssr: false,
    loading: () => <div className="h-11 w-full rounded-full bg-white/[0.08]" />,
  },
);

type MobileBottomBarProps = {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    spotify_url: string | null;
    apple_music_url: string | null;
    deezer_url: string | null;
  } | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { weight?: "fill" | "regular" }>;
  active: (pathname: string) => boolean;
};

// Subtle progressive backdrop blur instead of an opaque black bottom fade.
// Keep this decorative and behind the three mobile dock variants.
const BOTTOM_BLUR_STRENGTHS = [1, 3, 6] as const;

function BottomBlur({ mode = "standard" }: { mode?: "standard" | "search" | "review" }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 overflow-hidden md:hidden",
        mode === "review"
          ? "h-[calc(13rem+env(safe-area-inset-bottom))]"
          : mode === "search"
            ? "h-[calc(9rem+env(safe-area-inset-bottom))]"
            : "h-[calc(7rem+env(safe-area-inset-bottom))]",
      )}
    >
      {BOTTOM_BLUR_STRENGTHS.map((blur, index) => (
        <div
          key={blur}
          className="kocteau-mobile-bottom-blur-layer absolute inset-0"
          style={
            {
              "--bottom-blur": `${blur}px`,
              "--bottom-blur-start": `${index * 30}%`,
              "--bottom-blur-end": `${index * 30 + 40}%`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function NavTab({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const active = item.active(pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-[45px] min-w-[45px] items-center justify-center rounded-full px-[11px] text-foreground/65 transition-[background-color,color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-[var(--kocteau-dock-tab-hover)] hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 motion-reduce:transition-none max-[350px]:min-w-[41px] max-[350px]:px-[9px]",
        active &&
          "bg-[var(--kocteau-dock-tab-active)] px-[13px] text-foreground/95 shadow-[var(--kocteau-dock-selected-shadow)] hover:bg-[var(--kocteau-dock-tab-active)] hover:text-foreground max-[350px]:px-[9px]",
      )}
    >
      <span className="flex items-center gap-1.5 max-[350px]:gap-1">
        <Icon
          className={cn("size-[1.2rem] shrink-0", active && "text-foreground")}
          weight="regular"
        />
        {active ? (
          <span aria-hidden="true" className="whitespace-nowrap text-[12px] font-medium leading-none">
            {item.label}
          </span>
        ) : null}
      </span>
      <span className="sr-only">{item.label}</span>
    </Link>
  );
}

export default function MobileBottomBar({ profile }: MobileBottomBarProps) {
  const pathname = usePathname();
  const { detailHeader } = useRouteHeader();
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();

  const isSearchRoute = pathname.startsWith("/search");
  const fallbackRoute = profile ? "/feed" : "/reviews";
  const [previousRoute, setPreviousRoute] = useState(fallbackRoute);

  // Remember the actual in-app page rather than relying on browser history
  // (which may contain Search's canvas/selection states or an external page).
  useEffect(() => {
    if (!isSearchRoute && pathname !== "/") {
      setPreviousRoute(pathname);
    }
  }, [isSearchRoute, pathname]);

  // The public landing intentionally has no app dock.
  if (!isMobile || pathname === "/") return null;

  const pathSegments = pathname.split("/").filter(Boolean);
  const isReviewDetail =
    detailHeader?.kind === "review" &&
    Boolean(detailHeader.reviewId) &&
    ((pathSegments[0] === "review" && pathSegments.length === 2) ||
      (pathSegments[0] === "reviews" && pathSegments.length === 3));

  const navItems: NavItem[] = [
    {
      href: profile ? "/feed" : "/",
      label: "Home",
      icon: KocteauHomeIcon,
      active: (current) => current === (profile ? "/feed" : "/"),
    },
    {
      href: "/reviews",
      label: "Reviews",
      icon: KocteauReviewsIcon,
      active: (current) =>
        current === "/reviews" ||
        current.startsWith("/reviews/") ||
        current.startsWith("/review/"),
    },
    ...(profile
      ? [
          {
            href: "/library",
            label: "Library",
            icon: KocteauLibraryIcon,
            active: (current: string) =>
              current.startsWith("/library") || current.startsWith("/saved"),
          },
        ]
      : []),
  ];
  const isProfileActive = profile ? pathname.startsWith(`/u/${profile.username}`) : false;
  const returnTab = navItems.find((item) => item.active(previousRoute));
  const returnToProfile = Boolean(
    profile && previousRoute.startsWith(`/u/${profile.username}`),
  );
  const ReturnIcon = returnTab?.icon;
  const returnLabel = returnTab?.label ?? (returnToProfile ? "Profile" : "previous page");
  const dockTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 42, mass: 0.9 };

  return (
    <>
      <BottomBlur mode={isReviewDetail ? "review" : isSearchRoute ? "search" : "standard"} />
      {/* Filters float above the dock; the dock itself is one stable surface. */}
      {isSearchRoute ? (
        <div
          id="mobile-search-filters"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[28rem] -translate-x-1/2 md:hidden"
        />
      ) : null}
      {isReviewDetail && detailHeader?.reviewId ? (
        <nav
          aria-label="Comment controls"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 md:hidden"
        >
          <ReviewCommentDock
            reviewId={detailHeader.reviewId}
            initialCount={detailHeader.commentsCount ?? 0}
            profile={profile}
            returnPath={pathname}
          />
        </nav>
      ) : null}
      <nav
        aria-label={isSearchRoute ? "Search and return navigation" : "Primary navigation"}
        className={cn(
          "fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 -translate-x-1/2 md:hidden",
          isSearchRoute
            ? "w-[calc(100%-2rem)] max-w-[28rem]"
            : "w-max max-w-[calc(100%-2rem)]",
        )}
      >
        <div className="flex h-[53px] w-full items-center gap-[9px] max-[350px]:gap-[7px]">
          {/* The existing nav capsule contracts into a real return control. */}
          <motion.div
            layout={reduceMotion ? false : "size"}
            transition={{ layout: dockTransition }}
            className={cn(
              "relative h-[53px] min-w-[53px] shrink-0 overflow-hidden rounded-full bg-[var(--kocteau-dock-surface)] p-[4px] shadow-[var(--kocteau-dock-shadow)]",
              isSearchRoute ? "w-[53px]" : "w-fit",
            )}
          >
            <motion.div
              aria-hidden={isSearchRoute}
              inert={isSearchRoute}
              initial={false}
              animate={{ opacity: isSearchRoute ? 0 : 1, scale: isSearchRoute ? 0.96 : 1 }}
              transition={dockTransition}
              className={cn(
                "flex h-[45px] items-center gap-0.5 max-[350px]:gap-0",
                isSearchRoute
                  ? "pointer-events-none absolute inset-[4px]"
                  : "relative",
              )}
            >
            {navItems.map((item) => (
              <NavTab key={item.href} item={item} pathname={pathname} />
            ))}

            {profile ? (
              <Link
                href={`/u/${profile.username}`}
                aria-label="Profile"
                aria-current={isProfileActive ? "page" : undefined}
                className={cn(
                  "relative flex h-[45px] min-w-[45px] items-center justify-center rounded-full px-[9px] text-foreground/65 transition-[background-color,color,transform] duration-150 ease-[var(--kocteau-ease)] hover:bg-[var(--kocteau-dock-tab-hover)] hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 motion-reduce:transition-none max-[350px]:min-w-[41px] max-[350px]:px-[7px]",
                  isProfileActive &&
                    "bg-[var(--kocteau-dock-tab-active)] px-[11px] text-foreground/95 shadow-[var(--kocteau-dock-selected-shadow)] hover:bg-[var(--kocteau-dock-tab-active)] hover:text-foreground max-[350px]:px-[7px]",
                )}
              >
                <span className="flex items-center gap-1.5 max-[350px]:gap-1">
                  <UserAvatar
                    avatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    username={profile.username}
                    className="size-7"
                    sizes="28px"
                  />
                  {isProfileActive ? (
                    <span aria-hidden="true" className="whitespace-nowrap text-[12px] font-medium leading-none">
                      Profile
                    </span>
                  ) : null}
                </span>
              </Link>
            ) : null}
            </motion.div>
            <motion.div
              aria-hidden={!isSearchRoute}
              inert={!isSearchRoute}
              initial={false}
              animate={{ opacity: isSearchRoute ? 1 : 0, scale: isSearchRoute ? 1 : 0.96 }}
              transition={dockTransition}
              className={cn(
                "absolute inset-[4px]",
                !isSearchRoute && "pointer-events-none",
              )}
            >
              <Link
                href={previousRoute}
                aria-label={`Back to ${returnLabel}`}
                title={`Back to ${returnLabel}`}
                className="flex size-[45px] items-center justify-center rounded-full text-foreground/90 transition-colors hover:bg-[var(--kocteau-dock-tab-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                {ReturnIcon ? (
                  <ReturnIcon className="size-[1.2rem]" weight="regular" />
                ) : returnToProfile && profile ? (
                  <UserAvatar
                    avatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    username={profile.username}
                    className="size-7"
                    sizes="28px"
                  />
                ) : (
                  <KocteauChevronLeftMediumIcon className="size-[1.2rem]" weight="regular" />
                )}
              </Link>
            </motion.div>
          </motion.div>

          {/* The *same* right-hand Search capsule grows into the input.
              Neither surface is replaced, so the motion can reverse midway. */}
          <motion.div
            layout={reduceMotion ? false : "size"}
            transition={{ layout: dockTransition }}
            className={cn(
              "relative h-[53px] min-w-0 overflow-hidden rounded-full bg-[var(--kocteau-dock-review-surface)] p-[4px] shadow-[var(--kocteau-dock-shadow)]",
              isSearchRoute
                ? "flex-1 focus-within:ring-2 focus-within:ring-foreground/20"
                : "w-[53px] shrink-0",
            )}
          >
            <motion.div
              aria-hidden={isSearchRoute}
              inert={isSearchRoute}
              initial={false}
              animate={{ opacity: isSearchRoute ? 0 : 1, scale: isSearchRoute ? 0.96 : 1 }}
              transition={dockTransition}
              className={cn(
                "absolute inset-[4px]",
                isSearchRoute && "pointer-events-none",
              )}
            >
              <Link
                href="/search"
                aria-label="Search music"
                className="flex size-full items-center justify-center rounded-full text-foreground transition-colors hover:bg-[var(--kocteau-dock-review-hover)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <KocteauSearchIcon className="size-[1.2rem]" weight="regular" />
              </Link>
            </motion.div>
            <motion.div
              id="mobile-search-dock"
              aria-hidden={!isSearchRoute}
              inert={!isSearchRoute}
              initial={false}
              animate={{ opacity: isSearchRoute ? 1 : 0, scale: isSearchRoute ? 1 : 1.03 }}
              transition={dockTransition}
              className={cn(
                "absolute inset-[4px] z-10",
                !isSearchRoute && "pointer-events-none",
              )}
            />
          </motion.div>
        </div>
      </nav>
    </>
  );
}
