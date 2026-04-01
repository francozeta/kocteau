import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useKocteauTheme } from "@/hooks/use-kocteau-theme";

export default function TabLayout() {
  const theme = useKocteauTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.foreground,
        tabBarInactiveTintColor: theme.colors.foregroundMuted,
        tabBarLabelStyle: {
          fontSize: theme.typography.micro,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 74,
          paddingBottom: 10,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons color={color} name={focused ? "home-filled" : "home"} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons color={color} name={focused ? "search" : "manage-search"} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons color={color} name={focused ? "favorite" : "favorite-border"} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons color={color} name={focused ? "person" : "person-outline"} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
