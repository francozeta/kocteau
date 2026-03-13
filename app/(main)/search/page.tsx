import SearchPageClient from "@/components/search-page-client";
import { getRecentlyDiscussedTracks } from "@/lib/queries/discovery";
import { isSearchEntityType } from "@/lib/search-types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const initialType = isSearchEntityType(params.type) ? params.type : "track";
  const highlights = await getRecentlyDiscussedTracks(6);

  return (
    <SearchPageClient
      initialQuery={initialQuery}
      initialType={initialType}
      highlights={highlights}
    />
  );
}
