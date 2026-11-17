import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { api } from "@/api/client";
import type { Place } from "@airport/shared";
import { Button, ErrorText, Muted, styles, textStart } from "@/components/ui";
import { useI18n } from "@/i18n";
import { colors, radius, space } from "@/theme";

interface Props {
  value: Place | null;
  near?: { lat: number; lng: number };
  onChange: (p: Place | null) => void;
}

export function AddressPicker({ value, near, onChange }: Props) {
  const { t, lang, errorText } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const r = await api.searchPlaces(q, near, lang);
        if (id === seq.current) setResults(r.places);
      } catch (e) {
        if (id === seq.current) setError(errorText(e));
      } finally {
        if (id === seq.current) setSearching(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query, near?.lat, near?.lng, lang]);

  async function useMyLocation() {
    setError(null);
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setError(t.book.locationDenied);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = pos.coords;
      let label = t.book.myLocation;
      try {
        const [addr] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const parts = [addr?.street, addr?.district, addr?.city].filter(Boolean);
        if (parts.length) label = parts.join("، ");
      } catch {
        // reverse geocoding غير متاح على الويب بدون مفتاح — نكتفي بالإحداثيات
      }
      onChange({ label, lat, lng });
      setQuery("");
      setResults([]);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLocating(false);
    }
  }

  if (value) {
    return (
      <View style={[styles.row, box]}>
        <Ionicons name="location" size={22} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "600", textAlign: textStart }} numberOfLines={2}>
            {value.label}
          </Text>
          <Muted>
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </Muted>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="clear" onPress={() => onChange(null)} hitSlop={10}>
          <Ionicons name="close-circle" size={22} color={colors.muted} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: space(2) }}>
      <View style={[styles.row, styles.input, { paddingVertical: 0 }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.book.searchAddress}
          placeholderTextColor={colors.muted}
          style={{ flex: 1, paddingVertical: space(3), fontSize: 16, color: colors.text, textAlign: textStart }}
        />
        {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>
      {results.length > 0 ? (
        <View style={[box, { padding: 0 }]}>
          {results.map((p, i) => (
            <Pressable
              key={`${p.lat},${p.lng},${i}`}
              onPress={() => {
                onChange(p);
                setQuery("");
                setResults([]);
              }}
              style={({ pressed }) => [
                styles.row,
                { padding: space(3), borderTopWidth: i ? 1 : 0, borderTopColor: colors.border },
                pressed && { backgroundColor: colors.selectedBg },
              ]}
            >
              <Ionicons name="location-outline" size={18} color={colors.muted} />
              <Text style={{ flex: 1, color: colors.text, textAlign: textStart }} numberOfLines={2}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : query.trim().length >= 2 && !searching && !error ? (
        <Muted>{t.book.noResults}</Muted>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <Button
        variant="secondary"
        icon="navigate"
        title={locating ? t.book.locating : t.book.myLocation}
        loading={locating}
        onPress={useMyLocation}
      />
    </View>
  );
}

const box = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  padding: space(3),
  backgroundColor: colors.card,
} as const;
