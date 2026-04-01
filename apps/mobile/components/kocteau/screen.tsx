import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = false, contentContainerStyle, style }: ScreenProps) {
  const theme = useKocteauTheme();

  if (scroll) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }, style]} edges={["top"]}>
        <ScrollView
          contentContainerStyle={[
            {
              gap: theme.spacing.lg,
              paddingBottom: theme.spacing.xxxl,
              paddingHorizontal: theme.spacing.lg,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }, style]} edges={["top"]}>
      <View
        style={[
          {
            flex: 1,
            paddingBottom: theme.spacing.xxxl,
            paddingHorizontal: theme.spacing.lg,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
