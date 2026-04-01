import { PhaseList } from "@/components/kocteau/phase-list";
import { Screen } from "@/components/kocteau/screen";
import { SectionHeading } from "@/components/kocteau/section-heading";
import { mobileMigrationPhases } from "@/lib/roadmap";

export default function ActivityScreen() {
  return (
    <Screen scroll contentContainerStyle={{ gap: 24, paddingTop: 12 }}>
      <SectionHeading
        title="Activity and migration work"
        subtitle="Instead of fake notifications, this tab tracks the product build itself while the data layer catches up."
      />
      <PhaseList phases={mobileMigrationPhases} />
    </Screen>
  );
}
