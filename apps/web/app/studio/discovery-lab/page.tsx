import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/shell/app-shell";
import DiscoveryRankingLab from "@/components/studio/discovery-ranking-lab";
import { getCurrentUser } from "@/lib/auth/server";
import { isDiscoveryLabAvailable } from "@/lib/discovery/lab-access";
import { createPageMetadata } from "@/lib/metadata";
import { getStarterCuratorAccess } from "@/lib/queries/curation";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Discovery lab",
  description: "Private preview comparison of discovery ranking experiments.",
  path: "/studio/discovery-lab",
  noIndex: true,
});

// Intentionally outside (studio): production gating runs before its auth shell.
export default async function DiscoveryLabPage({
  searchParams,
}: {
  searchParams: Promise<{ local?: string | string[] }>;
}) {
  const params = await searchParams;
  if (!isDiscoveryLabAvailable({
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    localOptIn: params.local === "1",
  })) notFound();

  if (!await getCurrentUser()) redirect("/login");
  if (!await getStarterCuratorAccess()) notFound();

  return <AppShell variant="studio"><DiscoveryRankingLab /></AppShell>;
}
