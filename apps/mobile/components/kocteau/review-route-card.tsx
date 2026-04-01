import { Link } from "expo-router";
import { Pressable, Text } from "react-native";
import type { KocteauReviewCardModel } from "@kocteau/types";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";
import { ReviewCard } from "@/components/kocteau/review-card";

type RouteCardProps = {
  model: KocteauReviewCardModel;
};

function LinkChip({
  href,
  label,
}: {
  href: Parameters<typeof Link>[0]["href"];
  label: string;
}) {
  const theme = useKocteauTheme();

  return (
    <Link href={href} asChild>
      <Pressable
        style={{
          backgroundColor: theme.colors.accent,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Text style={{ color: theme.colors.accentForeground, fontSize: theme.typography.meta, fontWeight: "600" }}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

export function FeedReviewCard({ model }: RouteCardProps) {
  return (
    <ReviewCard
      model={model}
      footer={
        <>
          <LinkChip href={{ pathname: "/review/[id]", params: { id: model.review.id } }} label="Open review" />
          <LinkChip href={{ pathname: "/track/[id]", params: { id: model.entity.id } }} label="View track" />
        </>
      }
    />
  );
}

export function TrackReviewCard({ model }: RouteCardProps) {
  return (
    <ReviewCard
      model={model}
      eyebrow="Track discussion"
      footer={
        <>
          <LinkChip href={{ pathname: "/review/[id]", params: { id: model.review.id } }} label="Read review" />
          <LinkChip href={{ pathname: "/u/[username]", params: { username: model.author.username } }} label="Author" />
        </>
      }
    />
  );
}

export function ProfileReviewCard({ model }: RouteCardProps) {
  return (
    <ReviewCard
      model={model}
      footer={<LinkChip href={{ pathname: "/review/[id]", params: { id: model.review.id } }} label="Open review" />}
    />
  );
}

export function ReviewPageCard({ model }: RouteCardProps) {
  return <ReviewCard model={model} eyebrow="Review detail" />;
}
