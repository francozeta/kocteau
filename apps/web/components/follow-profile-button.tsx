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
      variant={state.following ? "secondary" : "outline"}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={state.following}
      aria-busy={isPending}
      aria-label={state.following ? "Unfollow profile" : "Follow profile"}
      className={cn(
        "rounded-full px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        state.following
          ? "border-border/38 bg-card/28 text-foreground hover:bg-card/34 md:border-border/28 md:bg-card/18"
          : "border-border/34 bg-card/16 text-foreground hover:bg-card/24 md:border-border/25 md:bg-transparent",
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
