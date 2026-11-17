import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useI18n } from "@/i18n";
import { colors } from "@/theme";

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.primaryText,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", lineHeight: 18 },
        ...(Platform.OS === "web" ? { tabBarStyle: { height: 72, paddingBottom: 8, paddingTop: 4 } } : {}),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.book.title,
          tabBarLabel: t.tabs.book,
          tabBarIcon: ({ color, size }) => <Ionicons name="airplane" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t.bookings.title,
          tabBarLabel: t.tabs.bookings,
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t.account.title,
          tabBarLabel: t.tabs.account,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
