import { MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { KocteauDiscoveryTrack } from "@kocteau/types";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";

type RecentTrackChipProps = {
  track: KocteauDiscoveryTrack;
};

export function RecentTrackChip({ track }: RecentTrackChipProps) {
  const theme = useKocteauTheme();

  return (
    <Link href={{ pathname: "/track/[id]", params: { id: track.entity.id } }} asChild>
      <Pressable
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.xl,
          borderWidth: 1,
          gap: theme.spacing.sm,
          minWidth: 176,
          padding: theme.spacing.md,
        }}
      >
        <View
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.emphasis,
            borderRadius: theme.radii.lg,
            height: 52,
            justifyContent: "center",
            width: 52,
          }}
        >
          <MaterialIcons color={theme.colors.foreground} name="album" size={24} />
        </View>
        <View style={{ gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              color: theme.colors.foreground,
              fontFamily: "serif",
              fontSize: theme.typography.bodyLarge,
              fontWeight: "600",
            }}
          >
            {track.entity.title}
          </Text>
          <Text numberOfLines={1} style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.meta }}>
            {track.entity.artistName ?? "Unknown artist"}
          </Text>
        </View>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.meta }}>
          {track.reviewCount} review{track.reviewCount === 1 ? "" : "s"} •{" "}
          {track.averageRating ? track.averageRating.toFixed(1) : "No score"}
        </Text>
      </Pressable>
    </Link>
  );
}
