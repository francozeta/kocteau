"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProfileEditorForm from "@/components/profile-editor-form";
import { useIsMobile } from "@/hooks/use-mobile";

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
  trigger: React.ReactNode;
};

export default function ProfileSettingsDialog({
  profile,
  trigger,
}: ProfileSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const content = (
    <ProfileEditorForm
      mode="settings"
      initialProfile={profile}
      onSaved={() => setOpen(false)}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="flex h-[92vh] max-h-[92vh] flex-col rounded-t-2xl border-border/60">
          <DrawerHeader className="border-b border-border/40 pb-3 text-left">
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>
              Update your public identity without leaving the current screen.
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl border-border/40">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your public identity without leaving the current screen.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
