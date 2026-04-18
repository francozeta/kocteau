"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import AvatarUploadTrigger from "@/components/avatar-upload-trigger";
import { supabaseBrowser } from "@/lib/supabase/client";
import AvatarCropDialog from "@/components/avatar-crop-dialog";
import type { PreparedAvatarUpload } from "@/lib/avatar-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  avatarPresets,
  createAvatarPresetDataUrl,
  createAvatarPresetSvg,
  type AvatarPresetId,
} from "@/lib/avatar-presets";
import { toastActionSuccess } from "@/lib/feedback";
import { getFirstFieldError } from "@/lib/validation/errors";
import { profileEditorSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

type ProfileDraft = {
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  onboarded: boolean | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

type SavedProfileDraft = ProfileDraft & {
  username: string;
};

type ProfileEditorFormProps = {
  mode: "onboarding" | "settings";
  initialProfile?: Partial<ProfileDraft>;
  onSaved?: (profile: SavedProfileDraft) => void;
  settingsLayout?: "default" | "panel";
  settingsSection?: "profile" | "avatar" | "links" | "all";
};

export default function ProfileEditorForm({
  mode,
  initialProfile,
  onSaved,
  settingsLayout = "default",
  settingsSection = "all",
}: ProfileEditorFormProps) {
  const supabase = supabaseBrowser();
  const pathname = usePathname();
  const router = useRouter();

  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [spotifyUrl, setSpotifyUrl] = useState(initialProfile?.spotify_url ?? "");
  const [appleMusicUrl, setAppleMusicUrl] = useState(initialProfile?.apple_music_url ?? "");
  const [deezerUrl, setDeezerUrl] = useState(initialProfile?.deezer_url ?? "");
  const [avatarUpload, setAvatarUpload] = useState<PreparedAvatarUpload | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<AvatarPresetId | null>(
    mode === "onboarding" && !initialProfile?.avatar_url
      ? avatarPresets[0].id
      : null,
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    display_name?: string;
    bio?: string;
    spotify_url?: string;
    apple_music_url?: string;
    deezer_url?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isAvatarCropDialogOpen, setIsAvatarCropDialogOpen] = useState(false);

  const [
    { errors: avatarUploadErrors, isDragging: isAvatarDragging },
    {
      clearErrors: clearAvatarUploadErrors,
      getInputProps: getAvatarInputProps,
      handleDragEnter: handleAvatarDragEnter,
      handleDragLeave: handleAvatarDragLeave,
      handleDragOver: handleAvatarDragOver,
      handleDrop: handleAvatarDrop,
      openFileDialog: openAvatarFileDialog,
    },
  ] = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onFilesAdded: (files) => {
      const nextFile = files[0]?.file;

      if (!(nextFile instanceof File)) {
        return;
      }

      setPendingAvatarFile(nextFile);
      setIsAvatarCropDialogOpen(true);
    },
  });

  const presetPreview = useMemo(() => {
    if (!selectedPresetId) {
      return null;
    }

    return createAvatarPresetDataUrl(selectedPresetId, 640);
  }, [selectedPresetId]);

  const avatarPreview = useMemo(() => {
    if (avatarUpload) {
      return URL.createObjectURL(avatarUpload.master.file);
    }

    if (presetPreview) {
      return presetPreview;
    }

    return initialProfile?.avatar_url ?? null;
  }, [avatarUpload, initialProfile?.avatar_url, presetPreview]);

  useEffect(() => {
    if (!avatarUpload || !avatarPreview) {
      return;
    }

    return () => {
      URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarUpload, avatarPreview]);

  async function uploadAvatar(userId: string) {
    if (!avatarUpload) return initialProfile?.avatar_url ?? null;

    const masterPath = `${userId}/avatar-master.webp`;
    const thumbPath = `${userId}/avatar-thumb.webp`;

    const [{ error: masterUploadError }, { error: thumbUploadError }] = await Promise.all([
      supabase.storage
        .from("avatars")
        .upload(masterPath, avatarUpload.master.file, {
          upsert: true,
          contentType: avatarUpload.master.mimeType,
        }),
      supabase.storage
        .from("avatars")
        .upload(thumbPath, avatarUpload.thumbnail.file, {
          upsert: true,
          contentType: avatarUpload.thumbnail.mimeType,
        }),
    ]);

    if (masterUploadError) throw masterUploadError;
    if (thumbUploadError) throw thumbUploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(masterPath);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function uploadPresetAvatar(userId: string) {
    if (!selectedPresetId) {
      return initialProfile?.avatar_url ?? null;
    }

    const path = `${userId}/preset-${selectedPresetId}.svg`;
    const svg = createAvatarPresetSvg(selectedPresetId, 640);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, new Blob([svg], { type: "image/svg+xml" }), {
        upsert: true,
        contentType: "image/svg+xml",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  function handlePresetSelect(presetId: AvatarPresetId) {
    setSelectedPresetId(presetId);
    setAvatarUpload(null);
    setPendingAvatarFile(null);
    clearAvatarUploadErrors();
  }

  function openAvatarPicker() {
    openAvatarFileDialog();
  }

  function handleAvatarCropDialogOpenChange(open: boolean) {
    setIsAvatarCropDialogOpen(open);

    if (!open) {
      setPendingAvatarFile(null);
    }
  }

  function handleAvatarCropConfirm(upload: PreparedAvatarUpload) {
    setAvatarUpload(upload);
    setSelectedPresetId(null);
    setPendingAvatarFile(null);
    setIsAvatarCropDialogOpen(false);
    clearAvatarUploadErrors();
  }

  async function revalidateProfileViews(previousUsername?: string | null, nextUsername?: string | null) {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          previousUsername,
          nextUsername,
        }),
      });
    } catch {
      // Best-effort cache invalidation.
    }
  }

  async function onSubmit() {
    setMessage(null);
    const parsed = profileEditorSchema.safeParse({
      username,
      display_name: displayName,
      bio,
      spotify_url: spotifyUrl,
      apple_music_url: appleMusicUrl,
      deezer_url: deezerUrl,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        username: getFirstFieldError(errors, "username") ?? undefined,
        display_name: getFirstFieldError(errors, "display_name") ?? undefined,
        bio: getFirstFieldError(errors, "bio") ?? undefined,
        spotify_url: getFirstFieldError(errors, "spotify_url") ?? undefined,
        apple_music_url: getFirstFieldError(errors, "apple_music_url") ?? undefined,
        deezer_url: getFirstFieldError(errors, "deezer_url") ?? undefined,
      });
      setMessage(parsed.error.flatten().formErrors[0] ?? null);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setMessage("You are not signed in. Please log in again.");
      setSaving(false);
      router.replace("/login");
      return;
    }

    try {
      const normalizedProfile = parsed.data;
      const previousUsername = initialProfile?.username?.trim().toLowerCase() ?? null;
      const avatarUrl = avatarUpload
        ? await uploadAvatar(user.id)
        : selectedPresetId
          ? await uploadPresetAvatar(user.id)
          : initialProfile?.avatar_url ?? null;

      const profilePayload = {
        id: user.id,
        username: normalizedProfile.username,
        display_name: normalizedProfile.display_name,
        bio: normalizedProfile.bio,
        avatar_url: avatarUrl ?? null,
        onboarded: mode === "onboarding" ? true : (initialProfile?.onboarded ?? true),
        spotify_url: normalizedProfile.spotify_url,
        apple_music_url: normalizedProfile.apple_music_url,
        deezer_url: normalizedProfile.deezer_url,
      };

      const { error } = await supabase.from("profiles").upsert(profilePayload, {
        onConflict: "id",
      });

      if (error) throw error;

      await revalidateProfileViews(previousUsername, normalizedProfile.username);
      onSaved?.(profilePayload);

      if (mode === "onboarding") {
        startTransition(() => {
          router.refresh();
          router.replace("/onboarding/taste");
        });
        setSaving(false);
        return;
      }

      const currentProfilePath = previousUsername ? `/u/${previousUsername}` : null;

      if (
        previousUsername &&
        previousUsername !== normalizedProfile.username &&
        currentProfilePath &&
        pathname.startsWith(currentProfilePath)
      ) {
        const nextProfilePath = `/u/${normalizedProfile.username}`;
        startTransition(() => {
          router.prefetch(nextProfilePath);
          router.replace(nextProfilePath);
        });
      } else {
        startTransition(() => {
          router.refresh();
        });
      }

      toastActionSuccess("Profile updated.");
    } catch (error) {
      const profileError = error as Error & { code?: string };

      if (profileError.code === "23505") {
        setMessage("That username is already in use.");
      } else {
        setMessage(profileError.message || "We could not save your profile.");
      }

      setSaving(false);
      return;
    }

    setSaving(false);
  }

  const isOnboarding = mode === "onboarding";
  const canAdvanceOnboarding = Boolean(selectedPresetId || avatarUpload);
  const showAvatarSettingsSection = !isOnboarding && (settingsSection === "all" || settingsSection === "avatar");
  const showProfileSettingsSection = isOnboarding || settingsSection === "all" || settingsSection === "profile";
  const showLinksSettingsSection = mode === "settings" && (settingsSection === "all" || settingsSection === "links");

  function renderAvatarSelection() {
    const previewUrl = avatarPreview ?? createAvatarPresetDataUrl(avatarPresets[0].id, 640);

    return (
      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:space-y-0">
        <div className="space-y-4">
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Choose an avatar
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick a default disc or drop in a photo. We&apos;ll let you crop it before saving.
            </p>
          </div>

          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 lg:mx-0 lg:items-start">
            <AvatarUploadTrigger
              alt="Selected avatar"
              previewUrl={previewUrl}
              size="lg"
              isDragging={isAvatarDragging}
              onClick={openAvatarPicker}
              onDragEnter={handleAvatarDragEnter}
              onDragLeave={handleAvatarDragLeave}
              onDragOver={handleAvatarDragOver}
              onDrop={handleAvatarDrop}
            />
            <div className="space-y-1 text-center lg:text-left">
              <div className="text-sm text-foreground/85">
                {(displayName || username || "your username").trim() || "your username"}
              </div>
              <div className="text-xs text-muted-foreground">
                {avatarUpload
                  ? "Uploaded photo ready"
                  : selectedPresetId
                    ? "Default disc selected"
                    : "Tap or drag a photo here"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Default discs</p>
              <p className="text-xs text-muted-foreground">
                Quick, polished, and made for Kocteau.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {avatarPresets.map((preset) => {
                const selected = selectedPresetId === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={cn(
                      "group relative flex aspect-square items-center justify-center rounded-[1.4rem] border border-border/25 bg-card/16 transition-all hover:border-border/45 hover:bg-card/26",
                      selected && "border-foreground/40 bg-card/26 ring-1 ring-foreground/18",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={createAvatarPresetDataUrl(preset.id, 240)}
                      alt={preset.label}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    {selected ? (
                      <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                    <span className="sr-only">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {avatarUploadErrors[0] ? (
            <p className="text-xs text-destructive">{avatarUploadErrors[0]}</p>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canAdvanceOnboarding}
              className="gap-2"
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderIdentityFields() {
    const panelSectionClassName = settingsLayout === "panel"
      ? "rounded-[1.35rem] border border-border/22 bg-card/14 p-4 sm:p-5"
      : "";

    return (
      <div className="space-y-6">
        {isOnboarding ? (
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Choose your profile
            </h2>
            <p className="text-sm text-muted-foreground">
              Set the name people will see across Kocteau.
            </p>
          </div>
        ) : null}

        {showAvatarSettingsSection ? (
          <section id="profile-settings-section-avatar" className={cn("space-y-4", panelSectionClassName)}>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Avatar</p>
              <p className="text-xs text-muted-foreground">
                Choose a disc or drop in a photo.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <AvatarUploadTrigger
                alt="Profile image"
                previewUrl={avatarPreview}
                size="md"
                isDragging={isAvatarDragging}
                onClick={openAvatarPicker}
                onDragEnter={handleAvatarDragEnter}
                onDragLeave={handleAvatarDragLeave}
                onDragOver={handleAvatarDragOver}
                onDrop={handleAvatarDrop}
              />

              <div className="min-w-0 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Profile image</p>
                  <p className="text-xs text-muted-foreground">
                    Tap the avatar or drop a photo. It opens the cropper right away.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {avatarUpload
                    ? "Uploaded photo ready"
                    : selectedPresetId
                      ? "Default disc selected"
                      : "Square crop applied before save"}
                </p>
                {avatarUploadErrors[0] ? (
                  <p className="text-xs text-destructive">{avatarUploadErrors[0]}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {avatarPresets.map((preset) => {
                const selected = selectedPresetId === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={cn(
                      "group relative flex aspect-square items-center justify-center rounded-[1rem] border border-border/25 bg-card/16 transition-all hover:border-border/45 hover:bg-card/26",
                      selected && "border-foreground/40 bg-card/26 ring-1 ring-foreground/18",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={createAvatarPresetDataUrl(preset.id, 160)}
                      alt={preset.label}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {selected ? (
                      <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background">
                        <Check className="size-2.5" />
                      </span>
                    ) : null}
                    <span className="sr-only">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {showProfileSettingsSection ? (
        <section id="profile-settings-section-profile" className={cn("space-y-4", !isOnboarding && panelSectionClassName)}>
          {!isOnboarding ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Profile</p>
              <p className="text-xs text-muted-foreground">
                Update the identity people see across the app.
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setFieldErrors((current) => ({ ...current, display_name: undefined }));
                }}
                placeholder="Fran Cocteau"
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.display_name)}
              />
              <FieldError>{fieldErrors.display_name}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setFieldErrors((current) => ({ ...current, username: undefined }));
                }}
                placeholder="fran_cocteau"
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.username)}
              />
              <FieldError>{fieldErrors.username}</FieldError>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => {
                setBio(event.target.value);
                setFieldErrors((current) => ({ ...current, bio: undefined }));
              }}
              placeholder="A short note about your taste, mood, or musical obsessions."
              className="min-h-24 resize-none"
              disabled={saving}
              maxLength={280}
              aria-invalid={Boolean(fieldErrors.bio)}
            />
            <FieldError>{fieldErrors.bio}</FieldError>
          </div>
        </section>
        ) : null}

        {showLinksSettingsSection ? (
          <section id="profile-settings-section-links" className={cn("grid gap-4", panelSectionClassName)}>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Music links</p>
              <p className="text-xs text-muted-foreground">
                Add the profiles and services you want people to find.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="spotify-url">Spotify URL</Label>
              <Input
                id="spotify-url"
                value={spotifyUrl}
                onChange={(event) => {
                  setSpotifyUrl(event.target.value);
                  setFieldErrors((current) => ({ ...current, spotify_url: undefined }));
                }}
                placeholder="open.spotify.com/..."
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.spotify_url)}
              />
              <FieldError>{fieldErrors.spotify_url}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apple-music-url">Apple Music URL</Label>
              <Input
                id="apple-music-url"
                value={appleMusicUrl}
                onChange={(event) => {
                  setAppleMusicUrl(event.target.value);
                  setFieldErrors((current) => ({ ...current, apple_music_url: undefined }));
                }}
                placeholder="music.apple.com/..."
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.apple_music_url)}
              />
              <FieldError>{fieldErrors.apple_music_url}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deezer-url">Deezer URL</Label>
              <Input
                id="deezer-url"
                value={deezerUrl}
                onChange={(event) => {
                  setDeezerUrl(event.target.value);
                  setFieldErrors((current) => ({ ...current, deezer_url: undefined }));
                }}
                placeholder="deezer.com/track/..."
                disabled={saving}
                aria-invalid={Boolean(fieldErrors.deezer_url)}
              />
              <FieldError>{fieldErrors.deezer_url}</FieldError>
            </div>
          </section>
        ) : null}

        <div className={cn("flex justify-end", isOnboarding && "justify-between")}>
          {isOnboarding ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={saving}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : null}

          <Button type="button" onClick={onSubmit} disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving...
              </>
            ) : mode === "onboarding" ? (
              "Enter Kocteau"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        {...getAvatarInputProps({
          "aria-label": "Upload avatar image",
          className: "sr-only",
          tabIndex: -1,
        })}
      />

      <AvatarCropDialog
        open={isAvatarCropDialogOpen}
        initialFile={pendingAvatarFile}
        onOpenChange={handleAvatarCropDialogOpenChange}
        onConfirm={handleAvatarCropConfirm}
      />

      {message ? (
        <Alert variant="destructive">
          <AlertTitle>We could not save your profile</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {isOnboarding ? (
        <>
          <div className="flex items-center justify-center gap-2">
            {[1, 2].map((stepIndex) => {
              const active = step === stepIndex;

              return (
                <span
                  key={stepIndex}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    active ? "w-8 bg-foreground" : "w-4 bg-border",
                  )}
                />
              );
            })}
          </div>
          {step === 1 ? renderAvatarSelection() : renderIdentityFields()}
        </>
      ) : (
        renderIdentityFields()
      )}
    </div>
  );
}
