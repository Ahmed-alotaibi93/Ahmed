import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "@/api/client";
import { Button, Card, ErrorText, Field, InfoRow, Muted, Screen, textStart } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDraft } from "@/state/draft";
import { colors, space } from "@/theme";

export default function ReviewScreen() {
  const { t, lang, money, formatDateTime, errorText } = useI18n();
  const { draft, reset } = useDraft();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { airport, location, pickupAt, option, quote } = draft;
  if (!airport || !location || !pickupAt || !option || !quote) return <Redirect href="/" />;

  const toAirport = draft.direction === "TO_AIRPORT";
  const airportName = lang === "ar" ? airport.nameAr : airport.nameEn;
  const address = [location.label, draft.addressDetails.trim()].filter(Boolean).join(" — ");

  async function confirm() {
    setError(null);
    setLoading(true);
    try {
      const { booking } = await api.createBooking({
        airportId: airport!.id,
        lat: location!.lat,
        lng: location!.lng,
        pickupAt: pickupAt!.toISOString(),
        direction: draft.direction,
        address,
        vehicleClassId: option!.vehicleClassId,
        flightNumber: draft.flightNumber || undefined,
        passengers: draft.passengers,
        bags: draft.bags,
        notes: notes.trim() || undefined,
      });
      reset();
      router.dismissAll();
      router.push({ pathname: "/booking/[id]", params: { id: booking.id, created: "1" } });
    } catch (e) {
      setError(errorText(e));
      setLoading(false);
    }
  }

  return (
    <Screen
      footer={
        <View style={{ gap: space(3) }}>
          <ErrorText>{error}</ErrorText>
          <Button title={`${t.review.confirm} · ${money(option.price.total)}`} icon="checkmark-circle" onPress={confirm} loading={loading} />
        </View>
      }
    >
      <Card>
        <InfoRow icon="radio-button-on" label={toAirport ? t.book.pickupAddress : t.book.airport} value={toAirport ? address : airportName} />
        <InfoRow icon="location" label={toAirport ? t.book.airport : t.book.dropoffAddress} value={toAirport ? airportName : address} />
        <InfoRow icon="time" label={t.review.pickupTime} value={formatDateTime(pickupAt)} />
        {draft.flightNumber ? <InfoRow icon="airplane" label={t.book.flightNumber} value={draft.flightNumber} /> : null}
        <InfoRow
          icon="car"
          label={t.review.vehicle}
          value={`${lang === "ar" ? option.nameAr : option.nameEn} · ${draft.passengers} ${t.vehicle.seats} · ${draft.bags} ${t.vehicle.bags}`}
        />
        <InfoRow icon="cash" label={t.review.payment} value={t.review.cash} />
      </Card>

      <Card>
        <Row label={`${t.vehicle.distance} (${quote.distanceKm} ${t.vehicle.km})`} value={money(option.price.total - option.price.nightSurcharge)} />
        {option.price.nightSurcharge > 0 ? <Row label={t.vehicle.nightNote} value={money(option.price.nightSurcharge)} /> : null}
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Row label={t.review.total} value={money(option.price.total)} bold />
      </Card>

      <Card>
        <Field label={t.review.notes} value={notes} onChangeText={setNotes} multiline maxLength={500} style={{ minHeight: 80, textAlignVertical: "top" }} />
      </Card>
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space(2) }}>
      {bold ? <Text style={{ fontWeight: "800", fontSize: 17, color: colors.text, textAlign: textStart }}>{label}</Text> : <Muted>{label}</Muted>}
      <Text style={{ fontWeight: bold ? "800" : "500", fontSize: bold ? 17 : 15, color: colors.text }}>{value}</Text>
    </View>
  );
}
