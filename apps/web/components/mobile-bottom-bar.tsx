"use client";

import type { ComponentType, SVGProps } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KocteauHomeIcon,
  KocteauLibraryIcon,
  KocteauSearchIcon,
} from "@/components/kocteau-icons";
import ReviewGlyphIcon from "@/components/review-glyph-icon";
import { useRouteHeader } from "@/components/route-header-context";
import UserAvatar from "@/components/user-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { OPEN_NEW_REVIEW_SHORTCUT_EVENT } from "@/hooks/use-global-shortcuts";
import { cn } from "@/lib/utils";

const ReviewCommentDock = dynamic(
  () => import("@/components/review-comment-dock"),
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

function BottomFade({ elevated = false }: { elevated?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_top,#000_0%,rgba(0,0,0,0.94)_42%,transparent_100%)] md:hidden",
        elevated ? "z-[100000]" : "z-40",
      )}
    />
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
        "group relative flex h-11 min-w-11 items-center justify-center rounded-full text-foreground/48 transition-[transform,color] duration-150 ease-out hover:text-foreground/80 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
        active
          ? "gap-1.5 px-3 text-foreground/96"
          : "",
      )}
    >
      {active ? <span aria-hidden="true" className="absolute inset-0 rounded-full bg-white/[0.14]" /> : null}
      <span className="relative z-[1] flex items-center gap-1.5">
        <Icon
          className={cn("size-[1.04rem] shrink-0", active && "text-foreground")}
          weight={active ? "fill" : "regular"}
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

  if (!isMobile) {
    return null;
  }

  if (pathname.startsWith("/search")) {
    return (
      <>
        <BottomFade elevated />
        <nav
          aria-label="Search controls"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-[100001] w-[calc(100%-2rem)] -translate-x-1/2 md:hidden"
        >
          <div id="mobile-search-dock" />
        </nav>
      </>
    );
  }

  if (
    detailHeader?.kind === "review" &&
    detailHeader.reviewId &&
    (/^\/review\/[^/]+$/.test(pathname) || /^\/reviews\/[^/]+\/[^/]+$/.test(pathname))
  ) {
    return (
      <>
        <BottomFade />
        <nav
          aria-label="Comment controls"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 md:hidden"
        >
          <ReviewCommentDock
            reviewId={detailHeader.reviewId}
            initialCount={detailHeader.commentsCount ?? 0}
            profile={profile}
            returnPath={pathname}
          />
        </nav>
      </>
    );
  }

  const navItems: NavItem[] = [
    {
      href: profile ? "/feed" : "/",
      label: "Home",
      icon: KocteauHomeIcon,
      active: (current) => current === (profile ? "/feed" : "/"),
    },
    {
      href: "/search",
      label: "Search",
      icon: KocteauSearchIcon,
      active: (current) => current.startsWith("/search") || current.startsWith("/track"),
    },
    ...(profile
      ? [
          {
            href: "/library",
            label: "Library",
            icon: KocteauLibraryIcon,
            active: (current: string) => current.startsWith("/library") || current.startsWith("/saved"),
          },
        ]
      : []),
  ];
  const isProfileActive = profile ? pathname.startsWith(`/u/${profile.username}`) : false;
  const reviewEntryLabel = profile ? "Review a track" : "Find a track to review";

  return (
    <>
      <BottomFade />
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 -translate-x-1/2 md:hidden"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-11 items-center gap-1 rounded-full bg-white/[0.08] backdrop-blur-2xl backdrop-saturate-150">
            {navItems.map((item) => (
              <NavTab key={item.href} item={item} pathname={pathname} />
            ))}

            {profile ? (
              <Link
                href={`/u/${profile.username}`}
                aria-label="Profile"
                aria-current={isProfileActive ? "page" : undefined}
                className={cn(
                  "relative flex h-11 min-w-11 items-center justify-center rounded-full text-foreground/48 transition-[transform,color] duration-150 hover:text-foreground/80 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  isProfileActive && "gap-1.5 px-2.5 text-foreground/96",
                )}
              >
                {isProfileActive ? (
                  <span aria-hidden="true" className="absolute inset-0 rounded-full bg-white/[0.14]" />
                ) : null}
                <span className="relative z-[1] flex items-center gap-1.5">
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
          </div>

          <button
            type="button"
            aria-label={reviewEntryLabel}
            className="flex size-11 items-center justify-center rounded-full bg-white/[0.08] text-foreground backdrop-blur-2xl backdrop-saturate-150 transition-[transform,background-color] duration-150 hover:bg-white/[0.12] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            onClick={() => {
              window.dispatchEvent(new CustomEvent(OPEN_NEW_REVIEW_SHORTCUT_EVENT));
            }}
          >
            <ReviewGlyphIcon className="size-[1.12rem]" weight="fill" />
          </button>
        </div>
      </nav>
    </>
  );
}
