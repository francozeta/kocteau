import { Text, View } from "react-native";
import { ProfileReviewCard } from "@/components/kocteau/review-route-card";
import { Screen } from "@/components/kocteau/screen";
import { SectionHeading } from "@/components/kocteau/section-heading";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";
import { getReviewsByUsername, mockViewerProfile } from "@/lib/mocks/feed";

export default function ProfileScreen() {
  const theme = useKocteauTheme();
  const reviews = getReviewsByUsername(mockViewerProfile.username);

  return (
    <Screen scroll contentContainerStyle={{ gap: 24, paddingTop: 12 }}>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.xxl,
          borderWidth: 1,
          gap: theme.spacing.lg,
          padding: theme.spacing.xl,
        }}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Text
            style={{
              color: theme.colors.foreground,
              fontFamily: "serif",
              fontSize: theme.typography.heroTitle,
              fontWeight: "700",
            }}
          >
            {mockViewerProfile.displayName}
          </Text>
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.body }}>
            @{mockViewerProfile.username}
          </Text>
        </View>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.body, lineHeight: 24 }}>
          {mockViewerProfile.bio}
        </Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.lg }}>
          <Text style={{ color: theme.colors.foreground, fontSize: theme.typography.meta, fontWeight: "600" }}>
            {mockViewerProfile.reviewsCount} reviews
          </Text>
          <Text style={{ color: theme.colors.foreground, fontSize: theme.typography.meta, fontWeight: "600" }}>
            {mockViewerProfile.followersCount} followers
          </Text>
          <Text style={{ color: theme.colors.foreground, fontSize: theme.typography.meta, fontWeight: "600" }}>
            {mockViewerProfile.followingCount} following
          </Text>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <SectionHeading title="Recent reviews" subtitle="Profile content reuses the same card primitive as the feed." />
        {reviews.map((entry) => (
          <ProfileReviewCard key={entry.review.id} model={entry} />
        ))}
      </View>
    </Screen>
  );
}
