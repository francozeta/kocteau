import type { ElementType } from "react";

import BrandLogo from "@/components/brand-logo";
import EntityCoverImage from "@/components/entity-cover-image";
import {
  KocteauActivityIcon,
  KocteauHealthIcon,
  KocteauHomeIcon,
  KocteauLibraryIcon,
  KocteauSearchIcon,
  KocteauStarterIcon,
  ReviewGlyphIcon,
} from "@/components/kocteau-icons";
import ReviewCard from "@/components/review-card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Bell,
  Bookmark,
  ChatCircleTextIcon,
  Heart,
  MagnifyingGlassIcon,
  MessageCircle,
  MoreHorizontal,
} from "@/components/ui/icons";
import type { StarterTrack } from "@/lib/starter";

type GuestProductPreviewProps = {
  starterTracks: StarterTrack[];
};

const mockReview = {
  id: "guest-preview-review",
  title: "A song that feels like sinking into memory",
  body: "It feels less like a song and more like being pulled under by something beautiful and unreachable. The vocal delivery is fragile but hypnotic, floating over the track like a distant thought you are trying to hold onto.",
  rating: 4.5,
  likes_count: 0,
  comments_count: 0,
  created_at: "2026-06-22T00:00:00.000Z",
};

const mockEntity = {
  id: "guest-preview-sea-swallow-me",
  provider: "deezer",
  provider_id: "guest-preview",
  type: "track",
  title: "Sea, Swallow Me",
  artist_name: "Cocteau Twins",
  cover_url:
    "https://cdn-images.dzcdn.net/images/cover/1dd28f59a8334d056452a671a3bc20a4/1000x1000-000000-80-0-0.jpg",
};

const mockAuthor = {
  id: "guest-preview-kocteau",
  username: "kocteau",
  display_name: "Kocteau",
  avatar_url:
    "https://ytxilnlmvioccfaomizi.supabase.co/storage/v1/object/public/avatars/4a051dcb-4955-4767-82e0-5a1fa38c28f9/avatar-master.webp?v=1780243301170",
};

const mockWriters = [
  {
    username: "shadcn",
    displayName: "shadcn",
    avatarUrl: "https://github.com/shadcn.png",
    fallback: "CN",
  },
  {
    username: "leerob",
    displayName: "Lee Robinson",
    avatarUrl: "https://github.com/leerob.png",
    fallback: "LR",
  },
  {
    username: "evilrabbit",
    displayName: "Evil Rabbit",
    avatarUrl: "https://github.com/evilrabbit.png",
    fallback: "ER",
  },
] as const;

const browseItems = [
  { label: "Feed", icon: KocteauHomeIcon, active: true },
  { label: "Explore", icon: MagnifyingGlassIcon },
  { label: "Atlas", icon: KocteauStarterIcon },
  { label: "Feedback", icon: ChatCircleTextIcon },
] as const;

const libraryItems = [
  { label: "Library", icon: KocteauLibraryIcon },
  { label: "Activity", icon: KocteauActivityIcon },
] as const;

const studioItems = [
  { label: "Starter", icon: KocteauStarterIcon },
  { label: "Health", icon: KocteauHealthIcon },
] as const;

type PreviewNavigationItem = {
  label: string;
  icon: ElementType;
  active?: boolean;
};

function PreviewNavigationGroup({
  label,
  items,
}: {
  label: string;
  items: readonly PreviewNavigationItem[];
}) {
  return (
    <div className="space-y-1.5">
      <p className="px-2 text-[10px] font-medium text-sidebar-foreground/52">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`flex h-8 items-center gap-2.5 rounded-xl px-2 text-[11px] font-medium ${
                item.active
                  ? "bg-sidebar-accent/82 text-sidebar-foreground"
                  : "text-sidebar-foreground/58"
              }`}
            >
              <Icon
                className={`size-3.5 shrink-0 ${
                  item.active
                    ? "text-sidebar-foreground"
                    : "text-sidebar-foreground/52"
                }`}
                weight={item.active ? "fill" : "regular"}
              />
              <span className="truncate">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewSidebar() {
  return (
    <aside className="flex min-h-0 flex-col bg-[var(--kocteau-preview-canvas)] px-2 py-2.5">
      <div className="flex min-h-9 items-center justify-between gap-2 px-1">
        <BrandLogo iconClassName="size-[1.15rem]" />
        <div className="flex items-center gap-1">
          <span className="flex size-7 items-center justify-center rounded-full text-sidebar-foreground/64">
            <KocteauSearchIcon className="size-3.5" />
          </span>
          <span className="flex size-7 items-center justify-center rounded-full bg-sidebar-accent/82 text-sidebar-foreground">
            <ReviewGlyphIcon className="size-3.5" />
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-3.5">
        <PreviewNavigationGroup label="Browse" items={browseItems} />
        <PreviewNavigationGroup label="Library" items={libraryItems} />
        <PreviewNavigationGroup label="Studio" items={studioItems} />
      </div>

      <div className="mt-auto hidden min-w-0 items-center gap-2 rounded-xl px-1.5 py-2 lg:flex">
        <Avatar className="size-6 bg-[var(--kocteau-preview-canvas)] ring-1 ring-white/[0.07]">
          <AvatarImage
            src="https://ytxilnlmvioccfaomizi.supabase.co/storage/v1/object/public/avatars/4a051dcb-4955-4767-82e0-5a1fa38c28f9/avatar-thumb.webp?v=1780243301170"
            alt="Kocteau"
          />
          <AvatarFallback className="text-[8px]">K</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium text-sidebar-foreground">
            Kocteau
          </p>
          <p className="truncate text-[9px] text-sidebar-foreground/52">
            @kocteau
          </p>
        </div>
        <Bell className="size-3.5 text-sidebar-foreground/52" />
      </div>
    </aside>
  );
}

function PreviewFeedTabs() {
  return (
    <div className="grid w-[16rem] grid-cols-3 gap-1 rounded-full p-0.5">
      {["For You", "Following", "Trending"].map((label, index) => (
        <span
          key={label}
          className={`inline-flex h-8 items-center justify-center rounded-full px-2 text-[11px] font-medium ${
            index === 0
              ? "bg-foreground/[0.07] text-foreground"
              : "text-muted-foreground/78"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function PreviewReview() {
  return (
    <ReviewCard
      review={mockReview}
      entity={mockEntity}
      author={mockAuthor}
      display={{
        entityMode: "cover",
        bodyClampLines: 4,
      }}
      slots={{
        headerActions: (
          <span className="flex size-7 items-center justify-center text-muted-foreground/60">
            <MoreHorizontal className="size-3.5" />
          </span>
        ),
        footer: (
          <div className="inline-flex items-center gap-0.5 rounded-full bg-foreground/[0.055] p-1">
            {[Heart, MessageCircle, Bookmark].map((Icon, index) => (
              <span
                key={index}
                className="flex size-7 items-center justify-center text-muted-foreground/72"
              >
                <Icon className="size-3.5" />
              </span>
            ))}
          </div>
        ),
      }}
    />
  );
}

function PreviewEditorialRail({
  starterTracks,
}: GuestProductPreviewProps) {
  const visibleStarterTracks = starterTracks.slice(0, 3);

  return (
    <aside className="flex min-h-0 flex-col px-3 pb-4 pt-3">
      <section className="min-h-[12.5rem] space-y-2.5">
        <p className="px-1 text-[10px] font-medium leading-none text-muted-foreground/70">
          Writers to notice
        </p>
        <div>
          {mockWriters.map((writer) => (
            <div
              key={writer.username}
              className="flex items-start gap-2 rounded-[0.62rem] px-1 py-2.5"
            >
              <Avatar className="size-7 ring-1 ring-white/[0.05]">
                <AvatarImage
                  src={writer.avatarUrl}
                  alt={`@${writer.username}`}
                />
                <AvatarFallback className="text-[8px]">
                  {writer.fallback}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-[10px] font-medium text-foreground">
                  {writer.displayName}
                </p>
                <p className="truncate text-[9px] text-muted-foreground/70">
                  Reviewing lately
                </p>
              </div>
              <span className="pt-1 text-[8.5px] font-medium text-foreground/82">
                Follow
              </span>
            </div>
          ))}
        </div>
      </section>

      {visibleStarterTracks.length > 0 ? (
        <section className="mt-auto space-y-2.5 pt-5">
          <p className="px-1 text-[10px] font-medium leading-none text-muted-foreground/70">
            Starter picks
          </p>
          <div className="flex gap-2 overflow-hidden px-1">
            {visibleStarterTracks.map((track) => (
              <div key={track.id} className="w-[4.5rem] shrink-0">
                <EntityCoverImage
                  src={track.cover_url}
                  alt={`${track.title} by ${track.artist_name}`}
                  sizes="72px"
                  variant="thumbnail"
                  className="aspect-square w-full rounded-[0.58rem] bg-muted shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                />
                <p className="mt-1.5 truncate text-[9px] font-medium text-foreground/86">
                  {track.title}
                </p>
                <p className="mt-0.5 truncate text-[8px] text-muted-foreground/58">
                  {track.artist_name}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-5 px-1 text-[8.5px] leading-4 text-muted-foreground/48">
        <p>Terms&nbsp;&nbsp; Privacy&nbsp;&nbsp; Cookies</p>
        <p>Changelog&nbsp;&nbsp; GitHub&nbsp;&nbsp; Discord</p>
        <p>© 2026 Kocteau</p>
      </footer>
    </aside>
  );
}

export default function GuestProductPreview({
  starterTracks,
}: GuestProductPreviewProps) {
  return (
    <section
      aria-label="Kocteau authenticated feed preview"
      className="kocteau-product-preview w-[calc(100%+5.5rem)] max-w-none sm:w-[calc(100%+4rem)] lg:w-[calc(100%+2rem)] xl:w-[calc(100%+3rem)]"
    >
      <div className="relative h-[28rem] overflow-hidden rounded-[0.95rem] bg-[var(--kocteau-preview-canvas)] shadow-[0_22px_70px_rgba(0,0,0,0.2)] ring-1 ring-foreground/[0.075] sm:h-[32rem] lg:h-[36rem]">
        <div className="grid h-full min-w-[52rem] grid-cols-[10.5rem_minmax(0,1fr)] lg:min-w-0 lg:grid-cols-[11.75rem_minmax(0,1fr)]">
          <PreviewSidebar />

          <div className="kocteau-app-frame m-1.5 ml-0 flex min-h-0 flex-col overflow-hidden rounded-[0.8rem] border border-[var(--kocteau-line)] bg-[var(--kocteau-preview-shell)] shadow-[inset_0_1px_0_var(--kocteau-topline)] sm:m-2.5 sm:ml-0">
            <header className="relative flex h-14 shrink-0 items-center justify-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.045)] sm:h-16">
              <p className="text-[12px] font-medium text-foreground sm:text-sm">
                Feed
              </p>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-[minmax(28rem,1fr)_13.5rem] gap-4 bg-[var(--kocteau-preview-shell)] px-5 lg:gap-5 lg:px-6">
              <main className="no-scrollbar min-w-0 overflow-hidden pb-8 pt-3">
                <PreviewFeedTabs />
                <div className="mt-3.5">
                  <PreviewReview />
                </div>
              </main>

              <PreviewEditorialRail starterTracks={starterTracks} />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[38%] sm:w-[28%] lg:hidden"
          style={{
            background:
              "linear-gradient(to left, var(--kocteau-preview-shell) 6%, color-mix(in oklch, var(--kocteau-preview-shell) 76%, transparent) 48%, transparent 100%)",
          }}
        />
      </div>
    </section>
  );
}
