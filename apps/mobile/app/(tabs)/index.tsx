import { ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { FeedHeader } from "@/components/kocteau/feed-header";
import { RecentTrackChip } from "@/components/kocteau/recent-track-chip";
import { FeedReviewCard } from "@/components/kocteau/review-route-card";
import { Screen } from "@/components/kocteau/screen";
import { SectionHeading } from "@/components/kocteau/section-heading";
import { mockDiscoveryTracks, mockReviewCards } from "@/lib/mocks/feed";

export default function FeedScreen() {
  return (
    <Screen scroll contentContainerStyle={{ gap: 24, paddingTop: 12 }}>
      <FeedHeader />

      <View style={{ gap: 16 }}>
        <SectionHeading
          title="Recently discussed"
          subtitle="A first mobile pass of the discovery rail the web app already uses."
          action={<Link href="/modal">Roadmap</Link>}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {mockDiscoveryTracks.map((track) => (
            <RecentTrackChip key={track.entity.id} track={track} />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 16 }}>
        <SectionHeading
          title="Feed"
          subtitle="The mobile build starts by protecting the web's strongest pattern: editorial cards with clear hierarchy."
        />
        {mockReviewCards.map((entry) => (
          <FeedReviewCard key={entry.review.id} model={entry} />
        ))}
      </View>
    </Screen>
  );
}
