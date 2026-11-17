import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { Booking } from "@airport/shared";
import { Muted, StatusBadge, styles, textStart } from "@/components/ui";
import { useI18n } from "@/i18n";
import { colors, space } from "@/theme";

export function BookingCard({ booking }: { booking: Booking }) {
  const { t, lang, money, formatDateTime } = useI18n();
  const toAirport = booking.direction === "TO_AIRPORT";
  const city = lang === "ar" ? booking.airport.cityAr : booking.airport.cityEn;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/booking/[id]", params: { id: booking.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <View style={styles.row}>
          <Ionicons name={toAirport ? "airplane" : "car"} size={18} color={colors.primary} />
          <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>
            {toAirport ? t.book.toAirport : t.book.fromAirport} · {city} ({booking.airport.code})
          </Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>
      <Muted>{formatDateTime(booking.pickupAt)}</Muted>
      <Text style={{ color: colors.text, textAlign: textStart }} numberOfLines={1}>
        {booking.address}
      </Text>
      <View style={[styles.row, { justifyContent: "space-between", marginTop: space(1) }]}>
        <Muted>{lang === "ar" ? booking.vehicleClass.nameAr : booking.vehicleClass.nameEn}</Muted>
        <Text style={{ fontWeight: "800", color: colors.text }}>{money(booking.price)}</Text>
      </View>
    </Pressable>
  );
}
