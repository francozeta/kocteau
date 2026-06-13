"use client";

import { isValidElement, useMemo, useState } from "react";
import {
  LinkIcon,
  VinylRecordIcon,
  type Icon,
} from "@/components/ui/icons";
import { KocteauProfileIcon } from "@/components/kocteau-icons";
import { buttonVariants } from "@/components/ui/button";
import {
  DrawerBase,
  DrawerBaseBackdrop,
  DrawerBaseContent,
  DrawerBaseDescription,
  DrawerBaseHandle,
  DrawerBaseHeader,
  DrawerBasePortal,
  DrawerBaseTitle,
  DrawerBaseTrigger,
  DrawerBaseViewport,
} from "@/components/ui/drawer-base";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import ProfileEditorForm from "@/components/profile-editor-form";
import UserAvatar from "@/components/user-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type SettingsProfile = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

type ProfileSettingsDialogProps = {
  profile: SettingsProfile;
  trigger?: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProfileUpdate?: (profile: SettingsProfile) => void;
};

export default function ProfileSettingsDialog({
  profile,
  trigger,
  triggerClassName,
  triggerLabel,
  open: controlledOpen,
  onOpenChange,
  onProfileUpdate,
}: ProfileSettingsDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isMobile = useIsMobile();
  const open = controlledOpen ?? uncontrolledOpen;
  const [activeSection, setActiveSection] = useState<"profile" | "avatar" | "links">("profile");

  const settingsNavItems = useMemo(
    () =>
      [
        {
          id: "profile" as const,
          label: "Profile",
          icon: KocteauProfileIcon,
        },
        {
          id: "avatar" as const,
          label: "Avatar",
          icon: VinylRecordIcon,
        },
        {
          id: "links" as const,
          label: "Music links",
          icon: LinkIcon,
        },
      ] satisfies Array<{
        id: "profile" | "avatar" | "links";
        label: string;
        icon: Icon;
      }>,
    [],
  );

  function handleOpenChange(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    if (nextOpen) {
      setActiveSection("profile");
    }

    onOpenChange?.(nextOpen);
  }

  const triggerNode = trigger ?? (
    triggerLabel ? (
      <button
        type="button"
        className={triggerClassName ?? buttonVariants({ variant: "outline", size: "sm" })}
      >
        {triggerLabel}
      </button>
    ) : null
  );
  const triggerElement = isValidElement(triggerNode) ? triggerNode : null;

  const form = (section: "profile" | "avatar" | "links" | "all") => (
    <ProfileEditorForm
      mode="settings"
      initialProfile={profile}
      settingsSection={section}
      onSaved={(updatedProfile) => {
        onProfileUpdate?.({
          username: updatedProfile.username,
          display_name: updatedProfile.display_name,
          avatar_url: updatedProfile.avatar_url,
          bio: updatedProfile.bio,
          spotify_url: updatedProfile.spotify_url,
          apple_music_url: updatedProfile.apple_music_url,
          deezer_url: updatedProfile.deezer_url,
        });
        handleOpenChange(false);
      }}
    />
  );

  if (isMobile) {
    return (
      <DrawerBase open={open} onOpenChange={handleOpenChange} swipeDirection="down">
        {triggerElement ? <DrawerBaseTrigger render={triggerElement} /> : null}
        <DrawerBasePortal>
          <DrawerBaseBackdrop className="bg-black/84" />
          <DrawerBaseViewport className="p-1.5">
            <DrawerBaseContent className="mb-0 max-h-[min(92dvh,44rem)] !rounded-[1rem] !border border-border/44 bg-[var(--kocteau-surface)] shadow-[0_22px_80px_rgba(0,0,0,0.42)]">
              <DrawerBaseHandle className="mt-2 h-1 w-9 bg-white/16" />
              <DrawerBaseHeader className="px-4 pb-2 pt-3 text-left">
                <DrawerBaseTitle className="!text-left text-[0.95rem] font-semibold">
                  Settings Profile
                </DrawerBaseTitle>
                <DrawerBaseDescription className="sr-only">
                  Update your Kocteau profile.
                </DrawerBaseDescription>
              </DrawerBaseHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                {form("all")}
              </div>
            </DrawerBaseContent>
          </DrawerBaseViewport>
        </DrawerBasePortal>
      </DrawerBase>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {triggerElement ? <DialogTrigger asChild>{triggerElement}</DialogTrigger> : null}
      <DialogContent
        showCloseButton={false}
        className="h-[min(86vh,41rem)] w-[min(calc(100vw-2rem),42rem)] max-w-none overflow-hidden rounded-[1rem] border-border/44 bg-[var(--kocteau-surface)] p-0 shadow-[0_22px_90px_rgba(0,0,0,0.42)]"
      >
        <div className="grid h-full min-h-0 grid-cols-[12.25rem_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-r border-border/24 bg-black/10 p-3">
            <div className="rounded-[0.72rem] bg-black/18 p-2.5">
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  avatarUrl={profile.avatar_url}
                  displayName={profile.display_name}
                  username={profile.username}
                  className="size-9"
                  initialsLength={2}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {profile.display_name ?? `@${profile.username}`}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground/68">
                    @{profile.username}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex h-9 w-full items-center gap-2.5 rounded-[0.58rem] px-2.5 text-left text-[13px] font-medium transition-colors",
                      active
                        ? "bg-white/[0.075] text-foreground"
                        : "text-muted-foreground/72 hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0"
                      weight={active ? "fill" : "regular"}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <DialogHeader className="flex-row items-center justify-between gap-3 px-4 py-3 text-left">
              <div className="min-w-0">
                <DialogTitle className="text-[0.95rem] font-semibold">
                  Settings Profile
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Update your Kocteau profile.
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="Close settings"
                  className="rounded-[0.45rem] outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <Kbd className="h-6 rounded-[0.42rem] bg-white/[0.07] px-2 text-[11px] text-muted-foreground/78">
                    Esc
                  </Kbd>
                </button>
              </DialogClose>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {form(activeSection)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
