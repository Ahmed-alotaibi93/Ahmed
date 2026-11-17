import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { api } from "@/api/client";
import type { Booking } from "@/api/types";
import { Button, Card, ErrorText, InfoRow, Loading, Muted, Screen, StatusBadge, styles } from "@/components/ui";
import { useI18n } from "@/i18n";
import { colors, radius, space } from "@/theme";

const CANCEL_CUTOFF_MS = 2 * 3600_000;

function confirmAsync(message: string, yes: string, no: string): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(message));
  return new Promise((resolve) =>
    Alert.alert(message, undefined, [
      { text: no, style: "cancel", onPress: () => resolve(false) },
      { text: yes, style: "destructive", onPress: () => resolve(true) },
    ]),
  );
}

export default function BookingDetail() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>();
  const { t, lang, money, formatDateTime, errorText } = useI18n();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .booking(Number(id))
      .then((r) => setBooking(r.booking))
      .catch((e) => setError(errorText(e)));
  }, [id]);

  if (!booking) return error ? <Screen><ErrorText>{error}</ErrorText></Screen> : <Loading />;

  const toAirport = booking.direction === "TO_AIRPORT";
  const airportName = lang === "ar" ? booking.airport.nameAr : booking.airport.nameEn;
  const canCancel =
    ["PENDING", "CONFIRMED"].includes(booking.status) &&
    new Date(booking.pickupAt).getTime() - Date.now() > CANCEL_CUTOFF_MS;

  async function cancel() {
    if (!(await confirmAsync(t.detail.cancelConfirm, t.detail.yes, t.detail.no))) return;
    setError(null);
    setCancelling(true);
    try {
      setBooking((await api.cancelBooking(booking!.id)).booking);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Screen>
      {created && booking.status !== "CANCELLED" ? (
        <View style={[styles.row, { backgroundColor: "#E6F4EC", padding: space(3), borderRadius: radius.md }]}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={{ color: colors.success, fontWeight: "700" }}>{t.review.success}</Text>
        </View>
      ) : null}

      <Card>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>
            {t.detail.bookingNo} {booking.id}
          </Text>
          <StatusBadge status={booking.status} />
        </View>
        <InfoRow icon="radio-button-on" label={toAirport ? t.book.pickupAddress : t.book.airport} value={toAirport ? booking.address : airportName} />
        <InfoRow icon="location" label={toAirport ? t.book.airport : t.book.dropoffAddress} value={toAirport ? airportName : booking.address} />
        <InfoRow icon="time" label={t.review.pickupTime} value={formatDateTime(booking.pickupAt)} />
        {booking.flightNumber ? <InfoRow icon="airplane" label={t.book.flightNumber} value={booking.flightNumber} /> : null}
        <InfoRow
          icon="car"
          label={t.review.vehicle}
          value={`${lang === "ar" ? booking.vehicleClass.nameAr : booking.vehicleClass.nameEn} · ${booking.passengers} ${t.vehicle.seats} · ${booking.bags} ${t.vehicle.bags}`}
        />
        <InfoRow icon="navigate" label={t.detail.distance} value={`${booking.distanceKm} ${t.vehicle.km}`} />
        <InfoRow icon="cash" label={t.review.payment} value={t.review.cash} />
        {booking.notes ? <InfoRow icon="chatbubble-ellipses" label={t.review.notes} value={booking.notes} /> : null}
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>{t.review.total}</Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>{money(booking.price)}</Text>
        </View>
      </Card>

      <ErrorText>{error}</ErrorText>
      {canCancel ? (
        <View style={{ gap: space(2) }}>
          <Button title={t.detail.cancel} variant="danger" icon="close-circle" onPress={cancel} loading={cancelling} />
          <Muted style={{ textAlign: "center" }}>{t.detail.cancelPolicy}</Muted>
        </View>
      ) : null}
    </Screen>
  );
}
