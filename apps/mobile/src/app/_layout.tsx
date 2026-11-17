import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Loading } from "@/components/ui";
import { I18nProvider, useI18n } from "@/i18n";
import { AuthProvider, useAuth } from "@/state/auth";
import { DraftProvider } from "@/state/draft";
import { colors } from "@/theme";

function RootStack() {
  const { ready, user } = useAuth();
  const { t } = useI18n();
  if (!ready) return <Loading />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.primaryText,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="book/vehicle" options={{ title: t.vehicle.title }} />
        <Stack.Screen name="book/review" options={{ title: t.review.title }} />
        <Stack.Screen name="booking/[id]" options={{ title: t.detail.title }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <DraftProvider>
            <StatusBar style="light" />
            <RootStack />
          </DraftProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
