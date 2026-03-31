export function isProfileOnboarded(profile?: {
  username?: string | null;
  onboarded?: boolean | null;
} | null) {
  if (typeof profile?.onboarded === "boolean") {
    return profile.onboarded;
  }

  const username = profile?.username?.trim();

  return Boolean(username && !username.startsWith("u_"));
}
