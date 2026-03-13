"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Camera, LoaderCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProfileDraft = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  deezer_url: string | null;
};

type ProfileEditorFormProps = {
  mode: "onboarding" | "settings";
  initialProfile?: Partial<ProfileDraft>;
  onSaved?: () => void;
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
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const avatarPreview = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }

    return initialProfile?.avatar_url ?? null;
  }, [avatarFile, initialProfile?.avatar_url]);

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
      const avatarUrl = await uploadAvatar(user.id);

      const profilePayload = {
        id: user.id,
        username: normalizedUsername,
        display_name: normalizedDisplayName,
        bio: normalizedBio || null,
        avatar_url: avatarUrl ?? null,
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

  return (
    <div className="space-y-6">
      {message ? (
        <Alert variant="destructive">
          <AlertTitle>We could not save your profile</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-muted">
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt={displayName || username || "Profile avatar"}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <Camera className="size-5 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            disabled={saving}
          />
        </div>
      </div>

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

      {mode === "settings" ? (
        <div className="grid gap-4">
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
        </div>
      ) : null}

      <div className="flex justify-end">
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
