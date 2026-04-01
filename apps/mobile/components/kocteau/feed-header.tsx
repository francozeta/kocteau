import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";

export function FeedHeader() {
  const theme = useKocteauTheme();

  return (
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
      <View style={{ gap: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.foregroundMuted,
            fontSize: theme.typography.micro,
            fontWeight: "700",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Kocteau mobile
        </Text>
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: "serif",
            fontSize: theme.typography.heroTitle,
            fontWeight: "700",
            lineHeight: 38,
          }}
        >
          Build the feed first, then let the rest of the product inherit the rhythm.
        </Text>
        <Text
          style={{
            color: theme.colors.foregroundMuted,
            fontSize: theme.typography.bodyLarge,
            lineHeight: 25,
          }}
        >
          This shell mirrors the Kocteau web direction: strong review cards, editorial spacing, and a calm monochrome system ready for shared business logic.
        </Text>
      </View>

      <Link href="/modal" asChild>
        <Pressable
          style={{
            alignSelf: "flex-start",
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radii.pill,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
          }}
        >
          <Text
            style={{
              color: theme.colors.accentForeground,
              fontSize: theme.typography.meta,
              fontWeight: "600",
            }}
          >
            View migration phases
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
