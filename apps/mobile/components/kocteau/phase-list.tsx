import { Text, View } from "react-native";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";

type Phase = {
  id: string;
  title: string;
  summary: string;
  items: readonly string[];
};

export function PhaseList({ phases }: { phases: readonly Phase[] }) {
  const theme = useKocteauTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      {phases.map((phase, index) => (
        <View
          key={phase.id}
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            gap: theme.spacing.sm,
            padding: theme.spacing.lg,
          }}
        >
          <Text
            style={{
              color: theme.colors.foregroundMuted,
              fontSize: theme.typography.micro,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Phase {index + 1}
          </Text>
          <Text
            style={{
              color: theme.colors.foreground,
              fontFamily: "serif",
              fontSize: theme.typography.cardTitle,
              fontWeight: "600",
            }}
          >
            {phase.title}
          </Text>
          <Text
            style={{
              color: theme.colors.foregroundMuted,
              fontSize: theme.typography.body,
              lineHeight: 22,
            }}
          >
            {phase.summary}
          </Text>
          <View style={{ gap: theme.spacing.xs }}>
            {phase.items.map((item) => (
              <View key={item} style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.foregroundMuted, marginTop: 1 }}>•</Text>
                <Text
                  style={{
                    color: theme.colors.foreground,
                    flex: 1,
                    fontSize: theme.typography.body,
                    lineHeight: 22,
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
