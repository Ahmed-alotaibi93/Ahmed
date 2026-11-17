import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button, Card, Muted, Screen, styles, textStart } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDraft } from "@/state/draft";
import { colors, radius, space } from "@/theme";

const icons: Record<string, "car-sport" | "car" | "bus" | "diamond"> = {
  ECONOMY: "car",
  FAMILY: "car-sport",
  LUXURY: "diamond",
  VAN: "bus",
};

export default function VehicleScreen() {
  const { t, lang, money } = useI18n();
  const { draft, update } = useDraft();
  const quote = draft.quote;
  if (!quote) return <Redirect href="/" />;

  return (
    <Screen
      footer={
        <Button
          title={draft.option ? `${t.vehicle.continue} · ${money(draft.option.price.total)}` : t.vehicle.continue}
          disabled={!draft.option}
          onPress={() => router.push("/book/review")}
        />
      }
    >
      <Card style={{ flexDirection: "row", alignItems: "center", gap: space(3) }}>
        <Ionicons name="navigate-circle" size={28} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Muted>{t.vehicle.distance}</Muted>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, textAlign: textStart }}>
            {quote.distanceKm} {t.vehicle.km}
          </Text>
        </View>
        {quote.distanceSource === "estimate" ? <Muted>{t.vehicle.estimateNote}</Muted> : null}
      </Card>

      {quote.options.map((o) => {
        const fits = o.seats >= draft.passengers && o.bags >= draft.bags;
        const selected = draft.option?.vehicleClassId === o.vehicleClassId;
        return (
          <Pressable
            key={o.vehicleClassId}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: !fits }}
            disabled={!fits}
            onPress={() => update({ option: o })}
            style={[
              styles.card,
              { flexDirection: "row", alignItems: "center", gap: space(3) },
              selected && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.selectedBg },
              !fits && { opacity: 0.45 },
            ]}
          >
            <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: space(2.5) }}>
              <Ionicons name={icons[o.code] ?? "car"} size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, textAlign: textStart }}>
                {lang === "ar" ? o.nameAr : o.nameEn}
              </Text>
              <Muted>
                {o.seats} {t.vehicle.seats} · {o.bags} {t.vehicle.bags}
              </Muted>
              {!fits ? <Muted style={{ color: colors.danger }}>{t.vehicle.tooSmall}</Muted> : null}
              {o.price.nightSurcharge > 0 ? <Muted>{t.vehicle.nightNote}</Muted> : null}
            </View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>{money(o.price.total)}</Text>
          </Pressable>
        );
      })}
    </Screen>
  );
}
