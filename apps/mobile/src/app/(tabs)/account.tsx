import { useEffect, useState } from "react";
import { Text } from "react-native";
import { api } from "@/api/client";
import { Button, Card, ErrorText, Field, InfoRow, Label, Muted, Screen, Segmented } from "@/components/ui";
import { useI18n, type Lang } from "@/i18n";
import { useAuth } from "@/state/auth";
import { colors } from "@/theme";

export default function AccountScreen() {
  const { t, lang, setLang, errorText } = useI18n();
  const { user, setUser, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setSaved(false), [name]);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      setUser((await api.updateMe(name)).user);
      setSaved(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Card>
        <InfoRow icon="call" label={t.account.phone} value={user?.phone ?? ""} />
        <Field label={t.account.name} placeholder={t.account.namePlaceholder} value={name} onChangeText={setName} maxLength={80} />
        <ErrorText>{error}</ErrorText>
        {saved ? <Text style={{ color: colors.success }}>{t.account.saved}</Text> : null}
        <Button title={t.account.save} variant="secondary" onPress={save} loading={saving} disabled={!name.trim()} />
      </Card>
      <Card>
        <Label>{t.account.language}</Label>
        <Segmented<Lang>
          value={lang}
          onChange={setLang}
          options={[
            { value: "ar", label: "العربية" },
            { value: "en", label: "English" },
          ]}
        />
      </Card>
      <Button title={t.account.logout} variant="danger" icon="log-out" onPress={signOut} />
      <Muted style={{ textAlign: "center" }}>v1.0.0</Muted>
    </Screen>
  );
}
