"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, Check, Disc3, LoaderCircle, Upload } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/user-avatar";
import {
  avatarPresets,
  createAvatarPresetDataUrl,
  createAvatarPresetSvg,
  type AvatarPresetId,
} from "@/lib/avatar-presets";
import { cn } from "@/lib/utils";

type ProfileDraft = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  onboarded: boolean | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

type ProfileEditorFormProps = {
  mode: "onboarding" | "settings";
  initialProfile?: Partial<ProfileDraft>;
  onSaved?: () => void;
  settingsLayout?: "default" | "panel";
  settingsSection?: "profile" | "avatar" | "links" | "all";
};

function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).toString();
  } catch {
    return "__invalid__";
  }
}

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<AvatarPresetId | null>(
    mode === "onboarding" && !initialProfile?.avatar_url
      ? avatarPresets[0].id
      : null,
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const presetPreview = useMemo(() => {
    if (!selectedPresetId) {
      return null;
    }

    return createAvatarPresetDataUrl(selectedPresetId, 640);
  }, [selectedPresetId]);

  const avatarPreview = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    if (presetPreview) {
      return presetPreview;
    }

    return initialProfile?.avatar_url ?? null;
  }, [avatarFile, initialProfile?.avatar_url, presetPreview]);

  useEffect(() => {
    if (!avatarFile || !avatarPreview) {
      return;
    }

    return () => {
      URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarFile, avatarPreview]);

  async function uploadAvatar(userId: string) {
    if (!avatarFile) return initialProfile?.avatar_url ?? null;

    const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
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
    return data.publicUrl;
  }

  function handlePresetSelect(presetId: AvatarPresetId) {
    setSelectedPresetId(presetId);
    setAvatarFile(null);
  }

  function handleAvatarUploadChange(file: File | null) {
    setAvatarFile(file);

    if (file) {
      setSelectedPresetId(null);
    }
  }

  function openAvatarPicker() {
    if (!fileInputRef.current) {
      return;
    }

    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  async function onSubmit() {
    setMessage(null);

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();
    const normalizedBio = bio.trim();
    const normalizedSpotifyUrl = normalizeUrl(spotifyUrl);
    const normalizedAppleMusicUrl = normalizeUrl(appleMusicUrl);
    const normalizedDeezerUrl = normalizeUrl(deezerUrl);

    if (!isValidUsername(normalizedUsername)) {
      setMessage("Username must be 3-20 characters and use only a-z, 0-9, and _.");
      return;
    }

    if (normalizedDisplayName.length < 2) {
      setMessage("Display name must be at least 2 characters.");
      return;
    }

    if (
      normalizedSpotifyUrl === "__invalid__" ||
      normalizedAppleMusicUrl === "__invalid__" ||
      normalizedDeezerUrl === "__invalid__"
    ) {
      setMessage("Music links must be valid URLs.");
      return;
    }

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
      const avatarUrl = avatarFile
        ? await uploadAvatar(user.id)
        : selectedPresetId
          ? await uploadPresetAvatar(user.id)
          : initialProfile?.avatar_url ?? null;

      const profilePayload = {
        id: user.id,
        username: normalizedUsername,
        display_name: normalizedDisplayName,
        bio: normalizedBio || null,
        avatar_url: avatarUrl ?? null,
        onboarded: mode === "onboarding" ? true : (initialProfile?.onboarded ?? true),
        spotify_url: normalizedSpotifyUrl,
        apple_music_url: normalizedAppleMusicUrl,
        deezer_url: normalizedDeezerUrl,
      };

      const { error } = await supabase.from("profiles").upsert(profilePayload, {
        onConflict: "id",
      });

      if (error) throw error;

      if (mode === "onboarding") {
        router.refresh();
        router.replace("/");
        setSaving(false);
        return;
      }

      const previousUsername = initialProfile?.username?.trim().toLowerCase();
      const currentProfilePath = previousUsername ? `/u/${previousUsername}` : null;

      if (
        previousUsername &&
        previousUsername !== normalizedUsername &&
        currentProfilePath &&
        pathname.startsWith(currentProfilePath)
      ) {
        const nextProfilePath = `/u/${normalizedUsername}`;
        router.prefetch(nextProfilePath);
        router.replace(nextProfilePath);
      } else {
        router.refresh();
      }

      onSaved?.();
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
  const canAdvanceOnboarding = Boolean(selectedPresetId || avatarFile);
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
              Pick a default disc or upload a photo. You can change it later.
            </p>
          </div>

          <div className="mx-auto flex max-w-sm justify-center lg:justify-start">
            <div className="rounded-[2rem] border border-border/25 bg-card/18 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex h-[18rem] w-[14rem] flex-col items-center rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] px-5 pt-6">
                <button
                  type="button"
                  onClick={openAvatarPicker}
                  className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Selected avatar"
                    className="h-32 w-32 rounded-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                  <span className="absolute right-1 bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/35 bg-background/88 text-muted-foreground backdrop-blur-sm transition-colors group-hover:text-foreground">
                    <Camera className="size-4" />
                  </span>
                </button>
                <div className="mt-auto space-y-1 pb-6 text-center">
                  <div className="text-sm text-foreground/85">
                    {(displayName || username || "your username").trim() || "your username"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {avatarFile
                      ? "Using uploaded photo"
                      : selectedPresetId
                        ? "Using default disc"
                        : "Choose your avatar"}
                  </div>
                </div>
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

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={openAvatarPicker}
              className="rounded-full border-border/25"
            >
              <Upload className="size-4" />
              Upload photo
            </Button>
            <p className="text-xs text-muted-foreground">
              A photo overrides the selected disc.
            </p>
          </div>

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
                Upload a photo or choose one of Kocteau&apos;s default discs.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={openAvatarPicker}
                className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <UserAvatar
                  avatarUrl={avatarPreview}
                  displayName={displayName || null}
                  username={username || null}
                  className="h-20 w-20 border-border/50 transition-transform duration-200 group-hover:scale-[1.02]"
                  fallbackClassName="text-lg font-semibold"
                  initialsLength={2}
                />
                <span className="absolute right-0 bottom-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/40 bg-background/90 text-muted-foreground backdrop-blur-sm transition-colors group-hover:text-foreground">
                  {selectedPresetId && !avatarFile ? (
                    <Disc3 className="size-3.5" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                </span>
              </button>

              <div className="min-w-0 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Profile image</p>
                  <p className="text-xs text-muted-foreground">
                    Tap the avatar or upload a photo. Selecting a disc will replace the photo choice.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openAvatarPicker}
                    className="rounded-full border-border/25"
                    disabled={saving}
                  >
                    <Upload className="size-4" />
                    Upload photo
                  </Button>
                  {avatarFile ? (
                    <span className="text-xs text-muted-foreground">
                      {avatarFile.name}
                    </span>
                  ) : null}
                </div>
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
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Fran Cocteau"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="fran_cocteau"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="A short note about your taste, mood, or musical obsessions."
              className="min-h-24 resize-none"
              disabled={saving}
            />
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
                onChange={(event) => setSpotifyUrl(event.target.value)}
                placeholder="open.spotify.com/..."
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apple-music-url">Apple Music URL</Label>
              <Input
                id="apple-music-url"
                value={appleMusicUrl}
                onChange={(event) => setAppleMusicUrl(event.target.value)}
                placeholder="music.apple.com/..."
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deezer-url">Deezer URL</Label>
              <Input
                id="deezer-url"
                value={deezerUrl}
                onChange={(event) => setDeezerUrl(event.target.value)}
                placeholder="deezer.com/track/..."
                disabled={saving}
              />
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
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleAvatarUploadChange(event.target.files?.[0] ?? null)}
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
