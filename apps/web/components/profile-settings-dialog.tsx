"use client";

import { useMemo, useState } from "react";
import { Disc3, Link2, UserRound } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserAvatar from "@/components/user-avatar";
import ProfileEditorForm from "@/components/profile-editor-form";
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ProfileSettingsDialog({
  profile,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ProfileSettingsDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isMobile = useIsMobile();
  const open = controlledOpen ?? uncontrolledOpen;
  const [activeSection, setActiveSection] = useState<"profile" | "avatar" | "links">("profile");

  const settingsNavItems = useMemo(() => ([
    {
      id: "profile" as const,
      label: "Profile",
      description: "Name, handle, bio",
      icon: UserRound,
    },
    {
      id: "avatar" as const,
      label: "Avatar",
      description: "Photo or default disc",
      icon: Disc3,
    },
    {
      id: "links" as const,
      label: "Music links",
      description: "Spotify, Apple Music, Deezer",
      icon: Link2,
    },
  ]), []);

  function handleOpenChange(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    if (nextOpen) {
      setActiveSection("profile");
    }

    onOpenChange?.(nextOpen);
  }

  function setSection(sectionId: "profile" | "avatar" | "links") {
    setActiveSection(sectionId);
  }

  const content = (
    <ProfileEditorForm
      mode="settings"
      initialProfile={profile}
      settingsLayout="panel"
      settingsSection={isMobile ? "all" : activeSection}
      onSaved={() => handleOpenChange(false)}
    />
  );

  const activeItem = settingsNavItems.find((item) => item.id === activeSection) ?? settingsNavItems[0];

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
        <DrawerContent className="flex h-[92vh] max-h-[92vh] flex-col rounded-t-2xl border-border/60 bg-background p-0">
          <DrawerHeader className="border-b border-border/34 px-5 py-4 text-left md:border-border/25">
            <DrawerTitle>{activeItem.label}</DrawerTitle>
            <DrawerDescription>
              {activeItem.description}
            </DrawerDescription>
          </DrawerHeader>

          <div className="border-b border-border/28 px-5 py-4 md:border-border/20">
            <div className="rounded-[1.35rem] border border-border/34 bg-card/24 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={profile.avatar_url}
                  displayName={profile.display_name}
                  username={profile.username}
                  className="size-11"
                  initialsLength={2}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile.display_name ?? `@${profile.username}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{profile.username}
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="mt-3 w-full whitespace-nowrap">
              <div className="flex gap-2 pb-1">
                {settingsNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSection(item.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                        active
                          ? "border-border/36 bg-card/30 text-foreground md:border-border/30 md:bg-card/26"
                          : "border-border/26 bg-card/18 text-muted-foreground hover:text-foreground md:border-border/15 md:bg-card/10",
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ProfileEditorForm
              mode="settings"
              initialProfile={profile}
              settingsLayout="panel"
              settingsSection={activeSection}
              onSaved={() => handleOpenChange(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="h-[min(86vh,48rem)] max-w-[min(72rem,calc(100vw-2.5rem))] overflow-hidden border-border/44 bg-background p-0 md:border-border/40">
        <div className="grid h-full min-h-0 grid-cols-[15.5rem_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-r border-border/32 bg-card/22 p-3 md:border-border/25 md:bg-card/14">
            <div className="rounded-[1.35rem] border border-border/34 bg-card/26 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:border-border/20 md:bg-card/18">
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={profile.avatar_url}
                  displayName={profile.display_name}
                  username={profile.username}
                  className="size-11"
                  initialsLength={2}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile.display_name ?? `@${profile.username}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{profile.username}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-background/92 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                        : "text-muted-foreground hover:bg-card/28 hover:text-foreground md:hover:bg-card/20",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <DialogHeader className="border-b border-border/32 px-6 py-5 text-left md:border-border/25">
              <DialogTitle>{activeItem.label}</DialogTitle>
              <DialogDescription>
                {activeItem.description}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {content}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
