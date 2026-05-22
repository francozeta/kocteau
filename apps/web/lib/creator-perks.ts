export const CREATOR_PERK_KEY = "first_reviewer_v0_builder" as const;

type EnvSource = Record<string, string | undefined>;

export type CreatorPerkUnlockInput = {
  hadPerkBefore: boolean;
  reviewId: string | null | undefined;
  persistedFirstReviewId: string | null | undefined;
};

export function didUnlockCreatorPerkOnReview({
  hadPerkBefore,
  reviewId,
  persistedFirstReviewId,
}: CreatorPerkUnlockInput) {
  return Boolean(
    !hadPerkBefore &&
      reviewId &&
      persistedFirstReviewId &&
      reviewId === persistedFirstReviewId,
  );
}

export function getV0ReferralUrl(env: EnvSource = process.env) {
  const value =
    env.V0_REFERRAL_URL?.trim() ||
    env.NEXT_PUBLIC_V0_REFERRAL_URL?.trim() ||
    null;

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}
