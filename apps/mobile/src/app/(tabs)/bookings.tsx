import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { api } from "@/api/client";
import type { Booking } from "@/api/types";
import { BookingCard } from "@/components/BookingCard";
import { Button, ErrorText, Loading, Muted, Screen, Segmented } from "@/components/ui";
import { useI18n } from "@/i18n";
import { colors, space } from "@/theme";

const ACTIVE = ["PENDING", "CONFIRMED", "DRIVER_ASSIGNED", "ON_THE_WAY"];

export default function BookingsScreen() {
  const { t, errorText } = useI18n();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const load = useCallback(() => {
    setError(null);
    api
      .bookings()
      .then((r) => setBookings(r.bookings))
      .catch((e) => setError(errorText(e)));
  }, [errorText]);

  useFocusEffect(load);

  if (!bookings && !error) return <Loading />;

  const upcoming = (bookings ?? [])
    .filter((b) => ACTIVE.includes(b.status))
    .sort((a, b) => a.pickupAt.localeCompare(b.pickupAt));
  const past = (bookings ?? []).filter((b) => !ACTIVE.includes(b.status));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <Screen>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "upcoming", label: `${t.bookings.upcoming} (${upcoming.length})` },
          { value: "past", label: `${t.bookings.past} (${past.length})` },
        ]}
      />
      <ErrorText>{error}</ErrorText>
      {error ? <Button title={t.common.retry} variant="secondary" onPress={load} /> : null}
      {list.map((b) => (
        <BookingCard key={b.id} booking={b} />
      ))}
      {bookings && list.length === 0 ? (
        <View style={{ alignItems: "center", gap: space(3), paddingVertical: space(10) }}>
          <Ionicons name="airplane-outline" size={48} color={colors.border} />
          <Muted>{t.bookings.empty}</Muted>
          <Button title={t.bookings.newBooking} onPress={() => router.navigate("/")} />
        </View>
      ) : null}
    </Screen>
  );
}
