"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/LoginForm";
import { Button, Card, cx, ErrorBox, Field, InfoRow } from "@/components/ui";
import { api } from "@/lib/api";
import { useApp } from "@/lib/providers";

function Account() {
  const { t, lang, setLang, errorText, user, setUser, signOut } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      setUser((await api.updateMe(name)).user);
      setSaved(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-extrabold">{t.account.title}</h1>
      <Card>
        <dl>
          <InfoRow label={t.account.phone} value={user?.phone ?? ""} />
        </dl>
        <form onSubmit={save} className="space-y-3">
          <Field
            label={t.account.name}
            placeholder={t.account.namePlaceholder}
            value={name}
            maxLength={80}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
          <ErrorBox>{error}</ErrorBox>
          {saved ? <p className="text-sm text-success">{t.account.saved}</p> : null}
          <Button type="submit" variant="secondary" loading={saving} disabled={!name.trim()} className="w-full">
            {t.account.save}
          </Button>
        </form>
      </Card>
      <Card>
        <div className="text-sm font-semibold">{t.account.language}</div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-brand-soft p-1">
          {(["ar", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cx("rounded-lg py-2 font-semibold", lang === l ? "bg-brand text-white" : "text-brand")}
            >
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
      </Card>
      <Button variant="danger" className="w-full" onClick={signOut}>
        {t.account.logout}
      </Button>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <Account />
    </RequireAuth>
  );
}
