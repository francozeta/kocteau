"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  KocteauChevronLeftSmallIcon,
  KocteauMusicLinksIcon,
  KocteauProfileIcon,
} from "@/components/kocteau-icons";
import { cn } from "@/lib/utils";

const settingsItems = [
  {
    href: "/settings/profile",
    label: "Profile",
    icon: KocteauProfileIcon,
  },
  {
    href: "/settings/music-links",
    label: "Music links",
    icon: KocteauMusicLinksIcon,
  },
] as const;

function SettingsLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className={cn(
        mobile
          ? "no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2"
          : "flex flex-col gap-1",
      )}
    >
      {settingsItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex h-9 shrink-0 items-center gap-2.5 rounded-[0.62rem] px-2.5 text-[13px] font-medium outline-none transition-[background-color,color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--kocteau-focus-ring)] active:scale-[0.98]",
              isActive
                ? "bg-foreground/[0.075] text-foreground"
                : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground/90",
              mobile && "h-8 rounded-full px-3",
            )}
          >
            <Icon
              weight={isActive ? "fill" : "regular"}
              className="size-[1.05rem]"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function SettingsNavigation() {
  return (
    <>
      <aside className="hidden h-svh w-[15.25rem] shrink-0 flex-col px-2.5 py-3 md:flex">
        <Link
          href="/feed"
          className="group flex h-9 w-fit items-center gap-1.5 rounded-[0.62rem] px-2 text-[13px] font-medium text-muted-foreground outline-none transition-[color,transform] duration-150 hover:text-foreground active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--kocteau-focus-ring)]"
        >
          <KocteauChevronLeftSmallIcon className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
          <span>Back to app</span>
        </Link>

        <div className="mt-7 px-2 pb-2 text-[11px] font-medium tracking-[0.01em] text-muted-foreground/72">
          Settings
        </div>
        <SettingsLinks />
      </aside>

      <div className="relative z-20 md:hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 h-24 bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.96)_48%,transparent_100%)]"
        />
        <header className="relative flex h-[calc(env(safe-area-inset-top)+3.5rem)] items-end justify-between px-3 pb-1">
          <Link
            href="/feed"
            aria-label="Back to app"
            className="flex size-10 items-center justify-center rounded-full text-foreground outline-none transition-[color,transform] duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[var(--kocteau-focus-ring)]"
          >
            <KocteauChevronLeftSmallIcon className="size-5" />
          </Link>
          <span className="pointer-events-none absolute inset-x-14 bottom-3 truncate text-center font-pixel text-[0.8rem] font-medium text-foreground/92">
            Settings
          </span>
          <span aria-hidden="true" className="size-10" />
        </header>
        <SettingsLinks mobile />
      </div>
    </>
  );
}
