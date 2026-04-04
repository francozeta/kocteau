import { createProfileOgImage } from "@/lib/og";
import { getPublicProfileByUsername } from "@/lib/queries/profiles";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  return createProfileOgImage({
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
  });
}
