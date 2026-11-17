import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BookingStatus } from "@/api/types";
import { useI18n } from "@/i18n";
import { colors, radius, space } from "@/theme";

/** محاذاة النص لبداية السطر (يمين بالعربي، يسار بالإنجليزي) */
export const textStart = (Platform.OS === "web" ? "start" : "left") as "left";

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={styles.footer}>
          <View style={styles.inner}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Field({ label, hint, style, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: space(1.5) }}>
      <Label>{label}</Label>
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, style]} {...props} />
      {hint ? <Muted>{hint}</Muted> : null}
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger";

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: ComponentProps<typeof Ionicons>["name"];
}) {
  const v = buttonVariants[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.button, v.box, inactive && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={v.text.color} /> : null}
          <Text style={[styles.buttonText, v.text]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { box: ViewStyle; text: { color: string } }> = {
  primary: { box: { backgroundColor: colors.primary }, text: { color: colors.primaryText } },
  secondary: { box: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, text: { color: colors.primary } },
  danger: { box: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger }, text: { color: colors.danger } },
};

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: ComponentProps<typeof Ionicons>["name"] }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            {o.icon ? <Ionicons name={o.icon} size={18} color={active ? colors.primaryText : colors.primary} /> : null}
            <Text style={[styles.segmentText, active && { color: colors.primaryText }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && { color: colors.primaryText }]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  icon: ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View style={styles.stepper}>
      <View style={styles.row}>
        <Ionicons name={icon} size={18} color={colors.muted} />
        <Text style={styles.stepperLabel}>{label}</Text>
      </View>
      <View style={styles.row}>
        <StepBtn icon="remove" disabled={value <= min} onPress={() => onChange(value - 1)} label={`${label} -`} />
        <Text style={styles.stepperValue}>{value}</Text>
        <StepBtn icon="add" disabled={value >= max} onPress={() => onChange(value + 1)} label={`${label} +`} />
      </View>
    </View>
  );
}

function StepBtn({ icon, disabled, onPress, label }: { icon: "add" | "remove"; disabled: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.stepBtn, disabled && { opacity: 0.35 }]}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <View style={styles.error}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={{ color: colors.danger, flex: 1 }}>{children}</Text>
    </View>
  );
}

export function InfoRow({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={[styles.row, { alignItems: "flex-start" }]}>
      <Ionicons name={icon} size={20} color={colors.muted} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Muted>{label}</Muted>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const statusColors: Record<BookingStatus, string> = {
  PENDING: "#B26A00",
  CONFIRMED: colors.primary,
  DRIVER_ASSIGNED: colors.primary,
  ON_THE_WAY: colors.success,
  COMPLETED: colors.success,
  CANCELLED: colors.muted,
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useI18n();
  const c = statusColors[status];
  return (
    <View style={[styles.badge, { borderColor: c }]}>
      <Text style={{ color: c, fontSize: 12, fontWeight: "600" }}>{t.status[status]}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: space(10) }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), paddingBottom: space(8) },
  inner: { width: "100%", maxWidth: 560, alignSelf: "center", gap: space(4) },
  footer: { padding: space(4), backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space(4), gap: space(3), borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, textAlign: textStart },
  muted: { fontSize: 13, color: colors.muted, textAlign: textStart },
  value: { fontSize: 15, color: colors.text, textAlign: textStart },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space(3),
    paddingVertical: space(3),
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space(2),
    paddingVertical: space(3.5),
    paddingHorizontal: space(4),
    borderRadius: radius.md,
    minHeight: 50,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  segmented: { flexDirection: "row", backgroundColor: colors.selectedBg, borderRadius: radius.md, padding: 4, gap: 4 },
  segment: { flex: 1, flexDirection: "row", gap: space(2), alignItems: "center", justifyContent: "center", paddingVertical: space(2.5), borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontWeight: "600", color: colors.primary },
  chip: { paddingHorizontal: space(3.5), paddingVertical: space(2), borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: space(2) },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepperLabel: { fontSize: 15, color: colors.text },
  stepperValue: { minWidth: 28, textAlign: "center", fontSize: 17, fontWeight: "700", color: colors.text },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  error: { flexDirection: "row", gap: space(2), alignItems: "center", backgroundColor: "#FDECEC", padding: space(3), borderRadius: radius.md },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space(2.5), paddingVertical: 3, alignSelf: "flex-start" },
});
