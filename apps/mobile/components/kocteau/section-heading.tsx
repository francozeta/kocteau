import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeading({ title, subtitle, action }: SectionHeadingProps) {
  const theme = useKocteauTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: theme.spacing.md,
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: theme.colors.foreground,
            flexShrink: 1,
            fontFamily: "serif",
            fontSize: theme.typography.sectionTitle,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
        {action}
      </View>
      {subtitle ? (
        <Text
          style={{
            color: theme.colors.foregroundMuted,
            fontSize: theme.typography.body,
            lineHeight: 22,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
