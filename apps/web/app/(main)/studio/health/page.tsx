import { notFound, redirect } from "next/navigation";
import RecommendationHealthSummary from "@/components/recommendation-health-summary";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getStarterCuratorAccess } from "@/lib/queries/curation";
import { getRecommendationHealthSnapshot } from "@/lib/queries/recommendation-health";
import { getRecommendationHealthDays } from "@/lib/recommendation-health/metrics";

export const metadata = createPageMetadata({
  title: "Recommendation Health",
  description: "Internal Kocteau recommendation health checks.",
  path: "/studio/health",
  noIndex: true,
});

export default async function RecommendationHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const hasAccess = await getStarterCuratorAccess();

  if (!hasAccess) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const daysParam = Array.isArray(resolvedSearchParams.days)
    ? resolvedSearchParams.days[0]
    : resolvedSearchParams.days;
  const selectedDays = getRecommendationHealthDays(daysParam);
  const { snapshot, unavailable } =
    await getRecommendationHealthSnapshot(selectedDays);

  return (
    <RecommendationHealthSummary
      snapshot={snapshot}
      selectedDays={selectedDays}
      unavailable={unavailable}
    />
  );
}
