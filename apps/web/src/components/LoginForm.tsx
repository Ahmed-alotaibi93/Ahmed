"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/providers";
import { Button, Card, ErrorBox, Field } from "./ui";

export function LoginForm({ onDone }: { onDone?: () => void }) {
  const { t, errorText, signIn } = useApp();
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^(?:\+?966|0)?5\d{8}$/.test(phone.replace(/[\s-]/g, ""))) return setError(t.errors.INVALID_PHONE);
    setLoading(true);
    try {
      const r = await api.requestOtp(phone);
      setSentTo(r.phone);
      setDevCode(r.devCode);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!sentTo) return;
    setError(null);
    setLoading(true);
    try {
      const r = await api.verifyOtp(sentTo, code);
      signIn(r.token, r.user);
      onDone?.();
    } catch (err) {
      setError(errorText(err));
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <h2 className="text-lg font-bold">{t.login.title}</h2>
      {!sentTo ? (
        <form onSubmit={send} className="space-y-4">
          <Field
            label={t.login.phone}
            placeholder={t.login.phonePlaceholder}
            type="tel"
            autoComplete="tel"
            dir="ltr"
            className="text-start"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <ErrorBox>{error}</ErrorBox>
          <Button type="submit" loading={loading} className="w-full">
            {t.login.sendCode}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-sm text-muted">
            {t.login.codeSentTo} <span dir="ltr">{sentTo}</span>
          </p>
          <Field
            label={t.login.code}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            dir="ltr"
            className="text-center text-xl tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          {devCode ? (
            <p className="text-sm text-muted">
              {t.login.devCode}: <span dir="ltr">{devCode}</span>
            </p>
          ) : null}
          <ErrorBox>{error}</ErrorBox>
          <Button type="submit" loading={loading} disabled={code.length !== 6} className="w-full">
            {t.login.verify}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setSentTo(null);
              setCode("");
              setError(null);
            }}
          >
            {t.login.changePhone}
          </Button>
        </form>
      )}
    </Card>
  );
}

/** يعرض المحتوى للمستخدم المسجل، أو نموذج الدخول */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authReady, user } = useApp();
  if (!authReady) return null;
  return user ? <>{children}</> : <LoginForm />;
}
