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
import { ArrowRight } from "@/components/ui/icons";
import AvatarCropDialog from "@/components/avatar-crop-dialog";
import GeneratedUserAvatar from "@/components/generated-user-avatar";
import OnboardingStepFrame from "@/components/auth/onboarding-step-frame";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import type { PreparedAvatarUpload } from "@/lib/avatar-image";
import { isLegacyPresetAvatarUrl } from "@/lib/avatar-image-url";
import { appendInternalNext } from "@/lib/internal-path";
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
    description: "Pick a disc, or upload a photo.",
  },
  {
    id: "bio",
    section: "Profile",
    title: "Write a short taste note.",
    description: "Optional. Add one line now, or leave it for later.",
  },
] as const satisfies ProfileStep[];

const onboardingFocusVisibleClass =
  "focus-visible:border-white/42 focus-visible:ring-0 focus-visible:shadow-none";
const onboardingFocusWithinClass =
  "focus-within:border-white/42 focus-within:ring-0 focus-within:shadow-none";

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
  nextPath = null,
}: {
  initialProfile?: Partial<ProfileDraft>;
  nextPath?: string | null;
}) {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [attemptedStepId, setAttemptedStepId] = useState<ProfileStepId | null>(null);
  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [avatarUpload, setAvatarUpload] = useState<PreparedAvatarUpload | null>(null);
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

  const avatarPreview = useMemo(() => {
    if (avatarUpload) {
      return URL.createObjectURL(avatarUpload.master.file);
    }

    return isLegacyPresetAvatarUrl(initialProfile?.avatar_url)
      ? null
      : initialProfile?.avatar_url ?? null;
  }, [avatarUpload, initialProfile?.avatar_url]);

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

  function handleAvatarCropDialogOpenChange(open: boolean) {
    setIsAvatarCropDialogOpen(open);

    if (!open) {
      setPendingAvatarFile(null);
    }
  }

  function handleAvatarCropConfirm(upload: PreparedAvatarUpload) {
    setAvatarUpload(upload);
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
      router.replace(appendInternalNext("/login", nextPath));
      return;
    }

    try {
      const normalizedProfile = parsed.data;
      const previousUsername = initialProfile?.username?.trim().toLowerCase() ?? null;
      const avatarUrl = avatarUpload
        ? await uploadAvatar(user.id)
        : isLegacyPresetAvatarUrl(initialProfile?.avatar_url)
          ? null
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
        router.replace(appendInternalNext("/onboarding/taste", nextPath));
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
          avatarPreviewUrl: avatarPreview,
          avatarSeed: username || displayName || "kocteau-user",
          isAvatarDragging,
          onAvatarClick: openAvatarFileDialog,
          onAvatarDragEnter: handleAvatarDragEnter,
          onAvatarDragLeave: handleAvatarDragLeave,
          onAvatarDragOver: handleAvatarDragOver,
          onAvatarDrop: handleAvatarDrop,
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
  avatarSeed,
  isAvatarDragging,
  onAvatarClick,
  onAvatarDragEnter,
  onAvatarDragLeave,
  onAvatarDragOver,
  onAvatarDrop,
  clearStepErrors,
}: {
  stepId: ProfileStepId;
  username: string;
  setUsername: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  avatarPreviewUrl: string | null;
  avatarSeed: string;
  isAvatarDragging: boolean;
  onAvatarClick: () => void;
  onAvatarDragEnter: DragEventHandler<HTMLButtonElement>;
  onAvatarDragLeave: DragEventHandler<HTMLButtonElement>;
  onAvatarDragOver: DragEventHandler<HTMLButtonElement>;
  onAvatarDrop: DragEventHandler<HTMLButtonElement>;
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
        className={cn(
          "h-11 w-full rounded-[var(--kocteau-radius-control)] border border-transparent bg-[var(--kocteau-surface-control)] px-4 text-base shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/55",
          onboardingFocusVisibleClass,
        )}
      />
    );
  }

  if (stepId === "handle") {
    return (
      <div
        className={cn(
          "flex h-11 w-full items-center rounded-[var(--kocteau-radius-control)] border border-transparent bg-[var(--kocteau-surface-control)] px-4 shadow-[var(--kocteau-shadow-control)]",
          onboardingFocusWithinClass,
        )}
      >
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
        avatarSeed={avatarSeed}
        isDragging={isAvatarDragging}
        onAvatarClick={onAvatarClick}
        onAvatarDragEnter={onAvatarDragEnter}
        onAvatarDragLeave={onAvatarDragLeave}
        onAvatarDragOver={onAvatarDragOver}
        onAvatarDrop={onAvatarDrop}
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
      className={cn(
        "min-h-28 w-full resize-none rounded-[var(--kocteau-radius-control)] border border-transparent bg-[var(--kocteau-surface-control)] p-4 text-base leading-6 shadow-[var(--kocteau-shadow-control)] placeholder:text-muted-foreground/55",
        onboardingFocusVisibleClass,
      )}
    />
  );
}

function ProfileAvatarControl({
  previewUrl,
  avatarSeed,
  isDragging,
  onAvatarClick,
  onAvatarDragEnter,
  onAvatarDragLeave,
  onAvatarDragOver,
  onAvatarDrop,
}: {
  previewUrl: string | null;
  avatarSeed: string;
  isDragging: boolean;
  onAvatarClick: () => void;
  onAvatarDragEnter: DragEventHandler<HTMLButtonElement>;
  onAvatarDragLeave: DragEventHandler<HTMLButtonElement>;
  onAvatarDragOver: DragEventHandler<HTMLButtonElement>;
  onAvatarDrop: DragEventHandler<HTMLButtonElement>;
}) {
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
            "group relative flex size-28 cursor-pointer items-center justify-center rounded-full border border-transparent bg-[var(--kocteau-surface-control)] p-1.5 transition-[background-color,border-color,transform] duration-150 ease-out hover:bg-[var(--kocteau-surface-control-hover)] active:scale-[0.96] focus-visible:outline-none",
            onboardingFocusVisibleClass,
            isDragging && "border-white/42 bg-[var(--kocteau-surface-control-hover)]",
          )}
        >
          <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-background outline outline-1 outline-white/10">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="size-full rounded-full object-cover"
              />
            ) : (
              <GeneratedUserAvatar seed={avatarSeed} />
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-black/0 transition-colors duration-150 ease-out group-hover:bg-black/12"
            />
          </span>
        </button>

      </div>
    </div>
  );
}
