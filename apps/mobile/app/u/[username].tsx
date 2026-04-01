import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ProfileReviewCard } from "@/components/kocteau/review-route-card";
import { Screen } from "@/components/kocteau/screen";
import { SectionHeading } from "@/components/kocteau/section-heading";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";
import { getProfileByUsername, getReviewsByUsername } from "@/lib/mocks/feed";

export default function UserProfileScreen() {
  const theme = useKocteauTheme();
  const { username } = useLocalSearchParams<{ username: string }>();
  const profile = username ? getProfileByUsername(username) : null;
  const reviews = username ? getReviewsByUsername(username) : [];

  if (!profile) {
    return (
      <Screen scroll contentContainerStyle={{ gap: 16, paddingTop: 12 }}>
        <SectionHeading
          title="Profile not found"
          subtitle="The route is wired and ready for real profile fetches in the next phase."
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
        <Text style={{ color: theme.colors.foreground, fontFamily: "serif", fontSize: theme.typography.heroTitle, fontWeight: "700" }}>
          {profile.displayName}
        </Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.body }}>@{profile.username}</Text>
        <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.body, lineHeight: 24 }}>
          {profile.bio}
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <SectionHeading
          title="Reviews"
          subtitle="Profile reviews intentionally reuse the feed card so the reading pattern stays familiar."
        />
        {reviews.map((entry) => (
          <ProfileReviewCard key={entry.review.id} model={entry} />
        ))}
      </View>
    </Screen>
  );
}
