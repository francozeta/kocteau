import { z } from "zod";
import { searchableEntityTypes } from "@/lib/search-types";

function optionalTrimmedString(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer.`)
    .transform((value) => value || null)
    .nullable()
    .optional()
    .transform((value) => value ?? null);
}

function optionalUrl(label: string) {
  return z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (!value) {
        return null;
      }

      const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

      try {
        return new URL(withProtocol).toString();
      } catch {
        ctx.addIssue({
          code: "custom",
          message: `${label} must be a valid URL.`,
        });
        return z.NEVER;
      }
    })
    .nullable()
    .optional()
    .transform((value) => value ?? null);
}

export const reviewIdParamsSchema = z.object({
  reviewId: z.string().uuid("Invalid review id."),
});

export const reviewCommentParamsSchema = reviewIdParamsSchema.extend({
  commentId: z.string().uuid("Invalid comment id."),
});

export const entityIdParamsSchema = z.object({
  id: z.string().uuid("Invalid entity id."),
});

export const profileIdParamsSchema = z.object({
  profileId: z.string().uuid("Invalid profile id."),
});

export const notificationParamsSchema = z.object({
  notificationId: z.string().uuid("Invalid notification id."),
});

export const notificationsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export const recentTracksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export const deezerSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(80, "Search queries can be up to 80 characters.")
    .optional()
    .transform((value) => value ?? ""),
  type: z.enum(searchableEntityTypes).optional().default("track"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

export const authEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
});

export const otpCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});

export const profileEditorSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "Username must be 3-20 characters and use only a-z, 0-9, and _."),
  display_name: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(40, "Display name must be 40 characters or fewer."),
  bio: z
    .string()
    .trim()
    .max(280, "Bio must be 280 characters or fewer.")
    .transform((value) => value || null),
  spotify_url: optionalUrl("Spotify URL"),
  apple_music_url: optionalUrl("Apple Music URL"),
  deezer_url: optionalUrl("Deezer URL"),
});

export const createReviewSchema = z.object({
  provider: z.literal("deezer"),
  provider_id: z.string().trim().min(1, "Missing provider track id."),
  type: z.enum(["track", "album"]),
  title: z.string().trim().min(1, "Track title is required.").max(160, "Track title is too long."),
  artist_name: optionalTrimmedString(160),
  cover_url: z.string().trim().url("Cover URL must be valid.").nullable().optional().transform((value) => value ?? null),
  deezer_url: z.string().trim().url("Deezer URL must be valid.").nullable().optional().transform((value) => value ?? null),
  review_title: optionalTrimmedString(120),
  review_body: optionalTrimmedString(2000),
  rating: z.preprocess(
    (value) => (value === null ? undefined : value),
    z
      .number({ error: "A rating is required." })
      .min(0.5, "Rating must be at least 0.5.")
      .max(5, "Rating must be 5 or less.")
      .multipleOf(0.5, "Rating must use 0.5 steps."),
  ),
  is_pinned: z.boolean().optional().default(false),
});

export const updateReviewSchema = z.object({
  review_title: optionalTrimmedString(120),
  review_body: optionalTrimmedString(2000),
  rating: z.preprocess(
    (value) => (value === null ? undefined : value),
    z
      .number({ error: "A rating is required." })
      .min(0.5, "Rating must be at least 0.5.")
      .max(5, "Rating must be 5 or less.")
      .multipleOf(0.5, "Rating must use 0.5 steps."),
  ),
  is_pinned: z.boolean().optional().default(false),
});

export const createCommentSchema = z
  .object({
    body: z
      .string()
      .trim()
      .min(1, "Comment body is required.")
      .max(1000, "Comments can be up to 1000 characters."),
    parent_id: z.null().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.parent_id) {
      ctx.addIssue({
        code: "custom",
        message: "Replies are not enabled yet.",
        path: ["parent_id"],
      });
    }
  });

export const reviewCollectionStateSchema = z.object({
  reviewIds: z
    .array(z.string().uuid("Invalid review id."))
    .max(50, "Too many reviews requested.")
    .default([]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AuthEmailInput = z.infer<typeof authEmailSchema>;
export type OtpCodeInput = z.infer<typeof otpCodeSchema>;
export type ProfileEditorInput = z.infer<typeof profileEditorSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ReviewCollectionStateInput = z.infer<typeof reviewCollectionStateSchema>;
