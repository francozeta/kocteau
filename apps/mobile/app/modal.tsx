import { Link } from "expo-router";
import { Text, View } from "react-native";
import { PhaseList } from "@/components/kocteau/phase-list";
import { Screen } from "@/components/kocteau/screen";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";
import { mobileMigrationPhases } from "@/lib/roadmap";

export default function ModalScreen() {
  const theme = useKocteauTheme();

  return (
    <Screen scroll contentContainerStyle={{ gap: 24, paddingTop: 12 }}>
      <View style={{ gap: 12 }}>
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: "serif",
            fontSize: theme.typography.sectionTitle,
            fontWeight: "700",
          }}
        >
          Mobile migration roadmap
        </Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.body, lineHeight: 24 }}>
          Keep the web app as the flagship product, then promote shared patterns only after they prove themselves on both platforms.
        </Text>
      </View>
      <PhaseList phases={mobileMigrationPhases} />
      <Link href="/" dismissTo>
        <Text style={{ color: theme.colors.foreground, fontSize: theme.typography.meta, fontWeight: "600" }}>
          Back to the feed
        </Text>
      </Link>
    </Screen>
  );
}
