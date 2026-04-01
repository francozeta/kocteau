import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getKocteauTheme } from "@kocteau/config";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getQueryClient } from "@/lib/query-client";

function createNavigationTheme(scheme: "light" | "dark"): Theme {
  const tokens = getKocteauTheme(scheme);
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      background: tokens.colors.background,
      border: tokens.colors.borderStrong,
      card: tokens.colors.surface,
      notification: tokens.colors.warning,
      primary: tokens.colors.accent,
      text: tokens.colors.foreground,
    },
  };
}

export function AppProviders({ children }: PropsWithChildren) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const navigationTheme = useMemo(() => createNavigationTheme(scheme), [scheme]);
  const queryClient = useMemo(() => getQueryClient(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationTheme}>
          {children}
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
