import { Stack } from "expo-router";
import "react-native-reanimated";
import { AppProviders } from "@/components/providers/app-providers";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="review/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="track/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="u/[username]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ headerShown: false, presentation: "modal" }} />
      </Stack>
    </AppProviders>
  );
}
