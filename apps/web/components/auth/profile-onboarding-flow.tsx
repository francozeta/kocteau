"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type DragEventHandler,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Disc3 } from "lucide-react";
import AvatarCropDialog from "@/components/avatar-crop-dialog";
import OnboardingStepFrame from "@/components/auth/onboarding-step-frame";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import type { PreparedAvatarUpload } from "@/lib/avatar-image";
import {
  avatarPresets,
  createAvatarPresetDataUrl,
  createAvatarPresetSvg,
  type AvatarPresetId,
} from "@/lib/avatar-presets";
import { supabaseBrowser } from "@/lib/supabase/client";
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

type ProfileStepId = "name" | "handle" | "avatar" | "bio";

type ProfileStep = {
  id: ProfileStepId;
  section: "Profile";
  title: string;
  description: string;
};

type FieldErrors = {
  username?: string;
  display_name?: string;
  bio?: string;
  spotify_url?: string;
  apple_music_url?: string;
  deezer_url?: string;
};

const profileSteps = [
  {
    id: "name",
    section: "Profile",
    title: "What should listeners call you?",
    description: "Use the name you want attached to reviews.",
  },
  {
    id: "handle",
    section: "Profile",
    title: "Choose your Kocteau handle.",
    description: "Short, searchable, and easy to mention.",
  },
  {
    id: "avatar",
    section: "Profile",
    title: "Choose a profile image.",
    description: "Use a photo or a Kocteau disc.",
  },
  {
    id: "bio",
    section: "Profile",
    title: "Write a short taste note.",
    description: "Optional. Add one line now, or leave it for later.",
  },
] as const satisfies ProfileStep[];

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

function getProfileStepError({
  stepId,
  displayName,
  username,
  bio,
}: {
  stepId: ProfileStepId;
  displayName: string;
  username: string;
  bio: string;
}) {
  if (stepId === "name" && displayName.trim().length < 2) {
    return "Add a display name to continue.";
  }

  if (stepId === "handle") {
    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername.length < 3) {
      return "Choose a handle with at least three characters.";
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      return "Use only a-z, 0-9, and _.";
    }
  }

  if (stepId === "bio" && bio.trim().length > 280) {
    return "Keep your taste note under 280 characters.";
  }

  return null;
}

export default function ProfileOnboardingFlow({
  initialProfile,
}: {
  initialProfile?: Partial<ProfileDraft>;
}) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [attemptedStepId, setAttemptedStepId] = useState<ProfileStepId | null>(null);
  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [avatarUpload, setAvatarUpload] = useState<PreparedAvatarUpload | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<AvatarPresetId | null>(
    initialProfile?.avatar_url ? null : avatarPresets[1].id,
  );
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isAvatarCropDialogOpen, setIsAvatarCropDialogOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const currentStep = profileSteps[currentStepIndex];
  const isLastStep = currentStepIndex === profileSteps.length - 1;
  const stepError = getProfileStepError({
    stepId: currentStep.id,
    displayName,
    username,
    bio,
  });
  const visibleError =
    message ??
    getVisibleFieldError(currentStep.id, fieldErrors) ??
    (attemptedStepId === currentStep.id ? stepError : null) ??
    avatarUploadErrors[0] ??
    null;

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

  function goBack() {
    setAttemptedStepId(null);
    setMessage(null);
    setCurrentStepIndex((index) => Math.max(index - 1, 0));
  }

  function handlePresetSelect(presetId: AvatarPresetId) {
    setSelectedPresetId(presetId);
    setAvatarUpload(null);
    setPendingAvatarFile(null);
    clearAvatarUploadErrors();
    setMessage(null);
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
    setMessage(null);
  }

  async function uploadAvatar(userId: string) {
    if (!avatarUpload) {
      return initialProfile?.avatar_url ?? null;
    }

    const masterPath = `${userId}/avatar-master.webp`;
    const thumbPath = `${userId}/avatar-thumb.webp`;

    const [{ error: masterUploadError }, { error: thumbUploadError }] =
      await Promise.all([
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

  async function saveProfile() {
    setMessage(null);

    const parsed = profileEditorSchema.safeParse({
      username,
      display_name: displayName,
      bio,
      spotify_url: initialProfile?.spotify_url ?? "",
      apple_music_url: initialProfile?.apple_music_url ?? "",
      deezer_url: initialProfile?.deezer_url ?? "",
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
        onboarded: true,
        spotify_url: normalizedProfile.spotify_url,
        apple_music_url: normalizedProfile.apple_music_url,
        deezer_url: normalizedProfile.deezer_url,
      };

      const { error } = await supabase.from("profiles").upsert(profilePayload, {
        onConflict: "id",
      });

      if (error) throw error;

      await revalidateProfileViews(previousUsername, normalizedProfile.username);

      startTransition(() => {
        router.refresh();
        router.replace("/onboarding/taste");
      });
    } catch (error) {
      const profileError = error as Error & { code?: string };

      if (profileError.code === "23505") {
        setMessage("That handle is already in use.");
      } else {
        setMessage(profileError.message || "We could not save your profile.");
      }

      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (stepError) {
      setAttemptedStepId(currentStep.id);
      return;
    }

    setAttemptedStepId(null);

    if (!isLastStep) {
      setCurrentStepIndex((index) => Math.min(index + 1, profileSteps.length - 1));
      return;
    }

    void saveProfile();
  }

  return (
    <>
      <input
        {...getAvatarInputProps({
          "aria-label": "Upload profile image",
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

      <OnboardingStepFrame
        section={currentStep.section}
        currentStep={currentStepIndex + 1}
        totalSteps={profileSteps.length}
        title={currentStep.title}
        description={currentStep.description}
        error={visibleError}
        onSubmit={handleSubmit}
        onBack={goBack}
        submitLabel="Continue"
        submitLoading={saving}
        submitIcon={!isLastStep ? <ArrowRight className="size-4" /> : null}
        liveMessage={`Profile, step ${currentStepIndex + 1} of ${profileSteps.length}.`}
      >
        {renderProfileStepControl({
          stepId: currentStep.id,
          username,
          setUsername,
          displayName,
          setDisplayName,
          bio,
          setBio,
          avatarPreviewUrl: avatarPreview ?? createAvatarPresetDataUrl("silver-haze", 640),
          selectedPresetId,
          isAvatarDragging,
          onAvatarClick: openAvatarFileDialog,
          onAvatarDragEnter: handleAvatarDragEnter,
          onAvatarDragLeave: handleAvatarDragLeave,
          onAvatarDragOver: handleAvatarDragOver,
          onAvatarDrop: handleAvatarDrop,
          onPresetSelect: handlePresetSelect,
          clearStepErrors: () => {
            setMessage(null);
            setAttemptedStepId(null);
          },
        })}
      </OnboardingStepFrame>
    </>
  );
}

function getVisibleFieldError(stepId: ProfileStepId, errors: FieldErrors) {
  if (stepId === "name") {
    return errors.display_name ?? null;
  }

  if (stepId === "handle") {
    return errors.username ?? null;
  }

  if (stepId === "bio") {
    return errors.bio ?? null;
  }

  return null;
}

function renderProfileStepControl({
  stepId,
  username,
  setUsername,
  displayName,
  setDisplayName,
  bio,
  setBio,
  avatarPreviewUrl,
  selectedPresetId,
  isAvatarDragging,
  onAvatarClick,
  onAvatarDragEnter,
  onAvatarDragLeave,
  onAvatarDragOver,
  onAvatarDrop,
  onPresetSelect,
  clearStepErrors,
}: {
  stepId: ProfileStepId;
  username: string;
  setUsername: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  avatarPreviewUrl: string;
  selectedPresetId: AvatarPresetId | null;
  isAvatarDragging: boolean;
  onAvatarClick: () => void;
  onAvatarDragEnter: DragEventHandler<HTMLButtonElement>;
  onAvatarDragLeave: DragEventHandler<HTMLButtonElement>;
  onAvatarDragOver: DragEventHandler<HTMLButtonElement>;
  onAvatarDrop: DragEventHandler<HTMLButtonElement>;
  onPresetSelect: (presetId: AvatarPresetId) => void;
  clearStepErrors: () => void;
}) {
  if (stepId === "name") {
    return (
      <Input
        autoFocus
        value={displayName}
        onChange={(event) => {
          setDisplayName(event.target.value);
          clearStepErrors();
        }}
        placeholder="Fran Cocteau"
        className="h-11 w-full rounded-[var(--kocteau-radius-control)] border-0 bg-[var(--kocteau-surface-control)] px-4 text-base shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/55 focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    );
  }

  if (stepId === "handle") {
    return (
      <div className="flex h-11 w-full items-center rounded-[var(--kocteau-radius-control)] bg-[var(--kocteau-surface-control)] px-4 shadow-[var(--kocteau-shadow-control)] focus-within:ring-2 focus-within:ring-ring/30">
        <span className="select-none text-base text-muted-foreground">@</span>
        <input
          autoFocus
          value={username}
          onChange={(event) => {
            setUsername(normalizeUsername(event.target.value));
            clearStepErrors();
          }}
          placeholder="fran_cocteau"
          className="h-full min-w-0 flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-muted-foreground/55"
        />
      </div>
    );
  }

  if (stepId === "avatar") {
    return (
      <ProfileAvatarControl
        previewUrl={avatarPreviewUrl}
        selectedPresetId={selectedPresetId}
        isDragging={isAvatarDragging}
        onAvatarClick={onAvatarClick}
        onAvatarDragEnter={onAvatarDragEnter}
        onAvatarDragLeave={onAvatarDragLeave}
        onAvatarDragOver={onAvatarDragOver}
        onAvatarDrop={onAvatarDrop}
        onPresetSelect={onPresetSelect}
      />
    );
  }

  return (
    <Textarea
      autoFocus
      value={bio}
      onChange={(event) => {
        setBio(event.target.value.slice(0, 280));
        clearStepErrors();
      }}
      placeholder="Dream pop, noisy guitars, late-night pop records."
      className="min-h-28 w-full resize-none rounded-[var(--kocteau-radius-control)] border-0 bg-[var(--kocteau-surface-control)] p-4 text-base leading-6 shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/55 focus-visible:ring-2 focus-visible:ring-ring/30"
    />
  );
}

function ProfileAvatarControl({
  previewUrl,
  selectedPresetId,
  isDragging,
  onAvatarClick,
  onAvatarDragEnter,
  onAvatarDragLeave,
  onAvatarDragOver,
  onAvatarDrop,
  onPresetSelect,
}: {
  previewUrl: string;
  selectedPresetId: AvatarPresetId | null;
  isDragging: boolean;
  onAvatarClick: () => void;
  onAvatarDragEnter: DragEventHandler<HTMLButtonElement>;
  onAvatarDragLeave: DragEventHandler<HTMLButtonElement>;
  onAvatarDragOver: DragEventHandler<HTMLButtonElement>;
  onAvatarDrop: DragEventHandler<HTMLButtonElement>;
  onPresetSelect: (presetId: AvatarPresetId) => void;
}) {
  const [isDiscPickerOpen, setIsDiscPickerOpen] = useState(false);

  return (
    <div className="relative mx-auto flex w-full max-w-[20rem] justify-center">
      <div className="relative">
        <button
          type="button"
          aria-label="Upload profile image"
          onClick={onAvatarClick}
          onDragEnter={onAvatarDragEnter}
          onDragLeave={onAvatarDragLeave}
          onDragOver={onAvatarDragOver}
          onDrop={onAvatarDrop}
          className={cn(
            "group relative flex size-28 cursor-pointer items-center justify-center rounded-full bg-[var(--kocteau-surface-control)] p-1.5 shadow-[var(--kocteau-shadow-control),0_14px_42px_rgba(0,0,0,0.22)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] hover:shadow-[var(--kocteau-shadow-card-hover),0_18px_52px_rgba(0,0,0,0.28)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            isDragging && "bg-[var(--kocteau-surface-control-hover)] ring-2 ring-ring/35",
          )}
        >
          <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-background outline outline-1 outline-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="size-full rounded-full object-cover"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-black/0 transition-colors duration-150 ease-out group-hover:bg-black/12"
            />
          </span>
        </button>

        <button
          type="button"
          aria-label="Choose a Kocteau disc"
          aria-expanded={isDiscPickerOpen}
          onClick={() => setIsDiscPickerOpen((open) => !open)}
          className={cn(
            "absolute -right-1 bottom-1 flex size-9 items-center justify-center rounded-full bg-background text-foreground shadow-[0_0_0_3px_var(--background),var(--kocteau-shadow-card-hover)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            isDiscPickerOpen && "bg-foreground text-background",
          )}
        >
          <Disc3
            className={cn(
              "size-4 transition-transform duration-150 ease-out",
              isDiscPickerOpen ? "rotate-45 scale-[0.96]" : "rotate-0 scale-100",
            )}
          />
        </button>
      </div>

      {isDiscPickerOpen ? (
        <div className="absolute left-1/2 top-[calc(100%+0.75rem)] z-10 w-[17rem] -translate-x-1/2 rounded-[1.05rem] bg-[var(--kocteau-surface)] p-2 shadow-[var(--kocteau-shadow-card-hover)]">
          <div className="grid grid-cols-3 gap-2">
            {avatarPresets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onPresetSelect(preset.id);
                    setIsDiscPickerOpen(false);
                  }}
                  className={cn(
                    "group relative flex aspect-square min-h-[4rem] items-center justify-center rounded-[0.85rem] bg-[var(--kocteau-surface-control)] shadow-[var(--kocteau-shadow-control)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                    isSelected &&
                      "bg-[var(--kocteau-surface-featured)] shadow-[var(--kocteau-shadow-card-hover)]",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={createAvatarPresetDataUrl(preset.id, 160)}
                    alt={preset.label}
                    className="size-12 rounded-full object-cover outline outline-1 outline-white/10"
                  />
                  {isSelected ? (
                    <span className="absolute right-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
