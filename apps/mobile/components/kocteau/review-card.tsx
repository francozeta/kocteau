import type { ReactNode } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import type { KocteauReviewCardModel } from "@kocteau/types";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";

type ReviewCardProps = {
  model: KocteauReviewCardModel;
  eyebrow?: string;
  footer?: ReactNode;
  showAuthor?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ReviewMetric({ icon, label }: { icon: keyof typeof MaterialIcons.glyphMap; label: string }) {
  const theme = useKocteauTheme();

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: theme.colors.chip,
        borderRadius: theme.radii.pill,
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
      }}
    >
      <MaterialIcons color={theme.colors.chipForeground} name={icon} size={15} />
      <Text style={{ color: theme.colors.chipForeground, fontSize: theme.typography.meta, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

export function ReviewCard({ model, eyebrow, footer, showAuthor = true }: ReviewCardProps) {
  const theme = useKocteauTheme();
  const authorLabel = model.author.displayName ?? `@${model.author.username}`;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.xxl,
        borderWidth: 1,
        gap: theme.spacing.lg,
        padding: theme.spacing.lg,
      }}
    >
      <View
        style={{
          alignItems: "flex-start",
          flexDirection: "row",
          gap: theme.spacing.md,
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          {eyebrow ? (
            <Text
              style={{
                color: theme.colors.foregroundMuted,
                fontSize: theme.typography.micro,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </Text>
          ) : null}

          <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {showAuthor ? (
              <>
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: theme.colors.emphasis,
                    borderRadius: theme.radii.pill,
                    height: 28,
                    justifyContent: "center",
                    width: 28,
                  }}
                >
                  <Text style={{ color: theme.colors.foreground, fontSize: theme.typography.micro, fontWeight: "700" }}>
                    {getInitials(authorLabel)}
                  </Text>
                </View>
                <Text style={{ color: theme.colors.foreground, fontSize: theme.typography.meta, fontWeight: "600" }}>
                  {authorLabel}
                </Text>
                <Text style={{ color: theme.colors.foregroundMuted }}>•</Text>
              </>
            ) : null}
            <Text style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.meta }}>
              {formatDate(model.review.createdAt)}
            </Text>
            {model.review.isPinned ? (
              <View
                style={{
                  backgroundColor: theme.colors.chip,
                  borderRadius: theme.radii.pill,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: theme.colors.chipForeground, fontSize: theme.typography.micro, fontWeight: "700" }}>
                  Pinned
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.emphasis,
            borderRadius: theme.radii.pill,
            flexDirection: "row",
            gap: 6,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 6,
          }}
        >
          <MaterialIcons color={theme.colors.warning} name="star" size={16} />
          <Text style={{ color: theme.colors.foreground, fontSize: theme.typography.meta, fontWeight: "700" }}>
            {model.review.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.xl,
          flexDirection: "row",
          gap: theme.spacing.md,
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
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              color: theme.colors.foreground,
              fontFamily: "serif",
              fontSize: theme.typography.bodyLarge,
              fontWeight: "600",
            }}
          >
            {model.entity.title}
          </Text>
          <Text numberOfLines={1} style={{ color: theme.colors.foregroundMuted, fontSize: theme.typography.meta }}>
            {model.entity.artistName ?? "Unknown artist"}
          </Text>
        </View>
      </View>

      {model.review.title ? (
        <Text
          style={{
            color: theme.colors.foreground,
            fontFamily: "serif",
            fontSize: theme.typography.cardTitle,
            fontWeight: "600",
            lineHeight: 27,
          }}
        >
          {model.review.title}
        </Text>
      ) : null}

      <Text
        style={{
          color: theme.colors.foreground,
          fontSize: theme.typography.body,
          lineHeight: 24,
          opacity: 0.88,
        }}
      >
        {model.review.body ?? "Only a rating was left for this release."}
      </Text>

      <View
        style={{
          alignItems: "center",
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
          paddingTop: theme.spacing.md,
        }}
      >
        <ReviewMetric icon="favorite-border" label={`${model.review.likesCount}`} />
        <ReviewMetric icon="chat-bubble-outline" label={`${model.review.commentsCount}`} />
        <ReviewMetric icon="bookmark-border" label={`${model.review.bookmarksCount ?? 0}`} />
      </View>

      {footer ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>{footer}</View> : null}
    </View>
  );
}
