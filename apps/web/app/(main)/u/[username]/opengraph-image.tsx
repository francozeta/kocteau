import { notFound } from "next/navigation";
import {
  createProfileOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og";
import { getPublicProfileByUsername } from "@/lib/queries/profiles";

export const runtime = "nodejs";
export const revalidate = 300;
export const alt = "Profile preview from Kocteau";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  return createProfileOgImage({
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
  });
}
