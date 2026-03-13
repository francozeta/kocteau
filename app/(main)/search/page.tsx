import SearchPageClient from "@/components/search-page-client";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const highlights = await getRecentlyDiscussedTracks(6);

  return <SearchPageClient initialQuery={initialQuery} highlights={highlights} />;
}
