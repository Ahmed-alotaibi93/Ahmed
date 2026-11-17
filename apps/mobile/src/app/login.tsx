import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "@/api/client";
import { Button, Card, ErrorText, Field, Muted, Screen, textStart } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useAuth } from "@/state/auth";
import { colors } from "@/theme";

export default function Login() {
  const { t, errorText, lang, setLang } = useI18n();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    if (!/^(?:\+?966|0)?5\d{8}$/.test(phone.replace(/[\s-]/g, ""))) return setError(t.errors.INVALID_PHONE);
    setLoading(true);
    try {
      const r = await api.requestOtp(phone);
      setSentTo(r.phone);
      setDevCode(r.devCode);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!sentTo) return;
    setError(null);
    setLoading(true);
    try {
      const r = await api.verifyOtp(sentTo, code);
      await signIn(r.token, r.user);
    } catch (e) {
      setError(errorText(e));
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 8, paddingTop: 48, paddingBottom: 16 }}>
        <View style={{ backgroundColor: colors.primary, borderRadius: 24, padding: 18 }}>
          <Ionicons name="airplane" size={40} color={colors.accent} />
        </View>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>{t.appName}</Text>
        <Muted>{t.tagline}</Muted>
      </View>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, textAlign: textStart }}>{t.login.title}</Text>
        {!sentTo ? (
          <>
            <Field
              label={t.login.phone}
              placeholder={t.login.phonePlaceholder}
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
              onSubmitEditing={send}
              style={{ textAlign: "left", writingDirection: "ltr" }}
            />
            <ErrorText>{error}</ErrorText>
            <Button title={t.login.sendCode} onPress={send} loading={loading} />
          </>
        ) : (
          <>
            <Muted>
              {t.login.codeSentTo} {sentTo}
            </Muted>
            <Field
              label={t.login.code}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              onSubmitEditing={verify}
            />
            {devCode ? (
              <Muted>
                {t.login.devCode}: {devCode}
              </Muted>
            ) : null}
            <ErrorText>{error}</ErrorText>
            <Button title={t.login.verify} onPress={verify} loading={loading} disabled={code.length !== 6} />
            <Button
              title={t.login.changePhone}
              variant="secondary"
              onPress={() => {
                setSentTo(null);
                setCode("");
                setError(null);
              }}
            />
          </>
        )}
      </Card>
      <Button
        variant="secondary"
        icon="language"
        title={lang === "ar" ? "English" : "العربية"}
        onPress={() => setLang(lang === "ar" ? "en" : "ar")}
      />
    </Screen>
  );
}
