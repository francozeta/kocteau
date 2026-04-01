import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Screen } from "@/components/kocteau/screen";
import { SectionHeading } from "@/components/kocteau/section-heading";
import { TrackReviewCard } from "@/components/kocteau/review-route-card";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";
import { getEntityById, getReviewsForEntity } from "@/lib/mocks/feed";

export default function TrackScreen() {
  const theme = useKocteauTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entity = id ? getEntityById(id) : null;
  const reviews = id ? getReviewsForEntity(id) : [];

  if (!entity) {
    return (
      <Screen scroll contentContainerStyle={{ gap: 16, paddingTop: 12 }}>
        <SectionHeading
          title="Track not found"
          subtitle="The detail route exists and is ready for live data in the next phase."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={{ gap: 24, paddingTop: 12 }}>
      <Link href="/" dismissTo>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.meta, fontWeight: "600" }}>
          Back to feed
        </Text>
      </Link>

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
            color: theme.colors.foregroundMuted,
            fontSize: theme.typography.micro,
            fontWeight: "700",
            letterSpacing: 1.1,
            textTransform: "uppercase",
          }}
        >
          Track page
        </Text>
        <Text style={{ color: theme.colors.foreground, fontFamily: "serif", fontSize: theme.typography.heroTitle, fontWeight: "700" }}>
          {entity.title}
        </Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.bodyLarge }}>
          {entity.artistName ?? "Unknown artist"}
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <SectionHeading
          title="Reviews on this release"
          subtitle="Track detail reuses the same card grammar as the feed while reserving room for track metadata and related listening."
        />
        {reviews.map((entry) => (
          <TrackReviewCard key={entry.review.id} model={entry} />
        ))}
      </View>
    </Screen>
  );
}
