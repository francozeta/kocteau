import { Text, View } from "react-native";
import { RecentTrackChip } from "@/components/kocteau/recent-track-chip";
import { Screen } from "@/components/kocteau/screen";
import { SectionHeading } from "@/components/kocteau/section-heading";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";
import { mockDiscoveryTracks } from "@/lib/mocks/feed";

export default function SearchScreen() {
  const theme = useKocteauTheme();

  return (
    <Screen scroll contentContainerStyle={{ gap: 24, paddingTop: 12 }}>
      <SectionHeading
        title="Search and discovery"
        subtitle="This phase keeps the shape of Kocteau's search experience without wiring live providers yet."
      />

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.xxl,
          borderWidth: 1,
          gap: theme.spacing.md,
          padding: theme.spacing.xl,
        }}
      >
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: "serif",
            fontSize: theme.typography.cardTitle,
            fontWeight: "600",
          }}
        >
          Coming next
        </Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.body, lineHeight: 24 }}>
          Universal search, track lookup, and saved recent queries should share backend contracts with the web app, but keep a native-first interaction model.
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <SectionHeading
          title="Track entry points"
          subtitle="These cards already route into a dedicated track detail screen so we can build the reading flow early."
        />
        {mockDiscoveryTracks.map((track) => (
          <RecentTrackChip key={track.entity.id} track={track} />
        ))}
      </View>
    </Screen>
  );
}
