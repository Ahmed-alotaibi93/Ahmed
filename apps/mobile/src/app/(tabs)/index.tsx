import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { api } from "@/api/client";
import type { Airport } from "@/api/types";
import { AddressPicker } from "@/components/AddressPicker";
import { Button, Card, Chip, ErrorText, Field, Label, Loading, Muted, Segmented, Screen, Stepper } from "@/components/ui";
import { useI18n } from "@/i18n";
import { ksaDayKey, ksaDays, slotsForDay } from "@/lib/time";
import { useDraft } from "@/state/draft";
import { space } from "@/theme";

const FLIGHT_RE = /^[A-Z0-9]{2}\s?\d{1,4}[A-Z]?$/;

export default function BookScreen() {
  const { t, lang, errorText, formatDay, formatTime } = useI18n();
  const { draft, update } = useDraft();
  const [airports, setAirports] = useState<Airport[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => ksaDays(14), []);
  const [dayKey, setDayKey] = useState(() => (draft.pickupAt ? ksaDayKey(draft.pickupAt) : days[0].key));
  const day = days.find((d) => d.key === dayKey) ?? days[0];
  const slots = useMemo(() => slotsForDay(day), [day]);

  const loadAirports = () => {
    setError(null);
    api
      .airports()
      .then((r) => setAirports(r.airports))
      .catch((e) => setError(errorText(e)));
  };
  useEffect(loadAirports, []);

  const toAirport = draft.direction === "TO_AIRPORT";
  const name = (a: Airport) => (lang === "ar" ? a.cityAr : a.cityEn);

  async function seePrices() {
    setError(null);
    const flight = draft.flightNumber.trim().toUpperCase();
    if (!draft.airport) return setError(t.book.chooseAirport);
    if (!draft.location) return setError(t.errors.MISSING_ADDRESS);
    if (!draft.pickupAt) return setError(t.book.time);
    if (!toAirport && !flight) return setError(t.errors.MISSING_FLIGHT);
    if (flight && !FLIGHT_RE.test(flight)) return setError(t.book.flightNumberHint);
    setLoading(true);
    try {
      const quote = await api.quote({
        airportId: draft.airport.id,
        lat: draft.location.lat,
        lng: draft.location.lng,
        pickupAt: draft.pickupAt.toISOString(),
      });
      const fits = quote.options.find((o) => o.seats >= draft.passengers && o.bags >= draft.bags);
      update({ quote, option: fits ?? null, flightNumber: flight });
      router.push("/book/vehicle");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  if (!airports && !error) return <Loading />;

  return (
    <Screen
      footer={
        <View style={{ gap: space(3) }}>
          <ErrorText>{error}</ErrorText>
          {airports ? (
            <Button title={t.book.seePrices} icon="pricetag" onPress={seePrices} loading={loading} />
          ) : (
            <Button title={t.common.retry} onPress={loadAirports} />
          )}
        </View>
      }
    >
      <Segmented
        value={draft.direction}
        onChange={(direction) => update({ direction })}
        options={[
          { value: "TO_AIRPORT", label: t.book.toAirport, icon: "airplane-outline" },
          { value: "FROM_AIRPORT", label: t.book.fromAirport, icon: "car-outline" },
        ]}
      />

      <Card>
        <Label>{t.book.airport}</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
          {airports?.map((a) => (
            <Chip
              key={a.id}
              label={`${name(a)} · ${a.code}`}
              selected={draft.airport?.id === a.id}
              onPress={() => update({ airport: a })}
            />
          ))}
        </View>
        {draft.airport ? <Muted>{lang === "ar" ? draft.airport.nameAr : draft.airport.nameEn}</Muted> : null}
      </Card>

      <Card>
        <Label>{toAirport ? t.book.pickupAddress : t.book.dropoffAddress}</Label>
        <AddressPicker
          value={draft.location}
          near={draft.airport ? { lat: draft.airport.lat, lng: draft.airport.lng } : undefined}
          onChange={(location) => update({ location })}
        />
        <Field
          label={t.book.addressDetails}
          value={draft.addressDetails}
          onChangeText={(addressDetails) => update({ addressDetails })}
          maxLength={150}
        />
      </Card>

      <Card>
        <Label>{t.book.date}</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }}>
          {days.map((d, i) => (
            <Chip
              key={d.key}
              label={i === 0 ? t.book.today : i === 1 ? t.book.tomorrow : formatDay(d.noon)}
              selected={d.key === dayKey}
              onPress={() => {
                setDayKey(d.key);
                update({ pickupAt: null });
              }}
            />
          ))}
        </ScrollView>
        <Label>{t.book.time}</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space(2) }}>
          {slots.map((s) => (
            <Chip
              key={s.toISOString()}
              label={formatTime(s)}
              selected={draft.pickupAt?.getTime() === s.getTime()}
              onPress={() => update({ pickupAt: s })}
            />
          ))}
        </ScrollView>
        {draft.pickupAt ? <Muted>{formatDay(draft.pickupAt)} · {formatTime(draft.pickupAt)}</Muted> : null}
      </Card>

      <Card>
        <Field
          label={toAirport ? t.book.flightNumberOptional : t.book.flightNumber}
          hint={t.book.flightNumberHint}
          value={draft.flightNumber}
          onChangeText={(flightNumber) => update({ flightNumber })}
          autoCapitalize="characters"
          maxLength={8}
          style={{ textAlign: "left", writingDirection: "ltr" }}
        />
        <Stepper
          icon="people"
          label={t.book.passengers}
          value={draft.passengers}
          min={1}
          max={12}
          onChange={(passengers) => update({ passengers })}
        />
        <Stepper icon="briefcase" label={t.book.bags} value={draft.bags} min={0} max={10} onChange={(bags) => update({ bags })} />
      </Card>
    </Screen>
  );
}
