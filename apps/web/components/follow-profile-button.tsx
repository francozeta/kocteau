"use client";

import { useMemo } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileFollow } from "@/hooks/use-profile-follow";
import { toastActionError, toastAuthRequired } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type FollowProfileButtonProps = {
  profileId: string;
  initialFollowing: boolean;
  isAuthenticated: boolean;
  isOwnProfile?: boolean;
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  showIcon?: boolean;
};

export default function FollowProfileButton({
  profileId,
  initialFollowing,
  isAuthenticated,
  isOwnProfile = false,
  size = "sm",
  className,
  activeLabel = "Following",
  inactiveLabel = "Follow",
  showIcon = false,
}: FollowProfileButtonProps) {
  const initialState = useMemo(
    () => ({
      following: initialFollowing,
    }),
    [initialFollowing],
  );
  const { state, toggleFollow, isPending } = useProfileFollow({
    profileId,
    initialState,
  });

  if (isOwnProfile) {
    return null;
  }

  async function handleClick() {
    if (!isAuthenticated) {
      toastAuthRequired("follow");
      return;
    }

    try {
      await toggleFollow();
    } catch (error) {
      toastActionError(error, "We couldn't update this follow right now.");
    }
  }

  return (
    <Button
      type="button"
      variant={state.following ? "secondary" : "default"}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={state.following}
      aria-busy={isPending}
      aria-label={state.following ? "Unfollow profile" : "Follow profile"}
      className={cn(
        "rounded-full px-3 shadow-none",
        state.following
          ? "!border-border !bg-black !text-white hover:!bg-accent hover:!text-white"
          : "!border-white !bg-white !text-black hover:!bg-white/94 hover:!text-black",
        isPending && "opacity-80",
        className,
      )}
    >
      {showIcon ? (
        state.following ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />
      ) : null}
      <span>{state.following ? activeLabel : inactiveLabel}</span>
    </Button>
  );
}
