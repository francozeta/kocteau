import { permanentRedirect } from "next/navigation";

// Keep historical links usable; "/" is the authenticated Feed.
export default async function LegacyFeedRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  permanentRedirect(`/${query.size ? `?${query.toString()}` : ""}`);
}
