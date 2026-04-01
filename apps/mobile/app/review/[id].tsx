import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ReviewPageCard } from "@/components/kocteau/review-route-card";
import { Screen } from "@/components/kocteau/screen";
import { SectionHeading } from "@/components/kocteau/section-heading";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";
import { getReviewById } from "@/lib/mocks/feed";

export default function ReviewDetailScreen() {
  const theme = useKocteauTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const review = id ? getReviewById(id) : null;

  if (!review) {
    return (
      <Screen scroll contentContainerStyle={{ gap: 16, paddingTop: 12 }}>
        <SectionHeading
          title="Review not found"
          subtitle="This placeholder route is ready for live fetching in the next phase."
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

      <SectionHeading
        title="Review detail"
        subtitle="This screen keeps the feed card intact, then expands with comments, thread context, and secondary actions later."
      />
      <ReviewPageCard model={review} />

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.xxl,
          borderWidth: 1,
          gap: theme.spacing.sm,
          padding: theme.spacing.lg,
        }}
      >
        <Text style={{ color: theme.colors.foreground, fontFamily: "serif", fontSize: theme.typography.cardTitle, fontWeight: "600" }}>
          Next for this route
        </Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.body, lineHeight: 24 }}>
          Comments, composer affordances, and optimistic engagement will plug into the same business layer once the mobile queries are connected.
        </Text>
      </View>
    </Screen>
  );
}
