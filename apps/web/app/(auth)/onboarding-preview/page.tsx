import { OnboardingFlowPreview } from "@/components/auth/onboarding-flow-preview";
import ReactQueryProvider from "@/app/providers/react-query-provider";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Onboarding preview",
  description: "Preview the redesigned Kocteau onboarding flow.",
  path: "/onboarding-preview",
  noIndex: true,
});

export default function OnboardingPreviewPage() {
  return (
    <ReactQueryProvider>
      <OnboardingFlowPreview />
    </ReactQueryProvider>
  );
}
