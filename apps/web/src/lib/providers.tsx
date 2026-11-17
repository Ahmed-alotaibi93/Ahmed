"use client";

import { ar, en, type Strings, type User } from "@airport/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, setAuthToken } from "./api";

export type Lang = "ar" | "en";

interface AppValue {
  lang: Lang;
  t: Strings;
  setLang: (l: Lang) => void;
  errorText: (e: unknown) => string;
  formatDateTime: (iso: string | Date) => string;
  formatDay: (d: Date) => string;
  formatTime: (d: Date) => string;
  money: (n: number) => string;
  authReady: boolean;
  user: User | null;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
  setUser: (u: User) => void;
}

const AppContext = createContext<AppValue | null>(null);

function storage(key: string, value?: string | null) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // التخزين غير متاح (وضع خاص مثلاً)
  }
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const saved = storage("lang");
    if (saved === "en") setLangState("en");
    const token = storage("token");
    if (!token) return setAuthReady(true);
    setAuthToken(token);
    api
      .me()
      .then((r) => setUser(r.user))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          storage("token", null);
          setAuthToken(null);
        }
      })
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const signIn = useCallback((token: string, u: User) => {
    storage("token", token);
    setAuthToken(token);
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    storage("token", null);
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AppValue>(() => {
    const t = lang === "ar" ? ar : en;
    const locale = lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB";
    const timeZone = "Asia/Riyadh";
    return {
      lang,
      t,
      setLang: (l) => {
        setLangState(l);
        storage("lang", l);
      },
      errorText: (e) => {
        const code = e instanceof ApiError ? e.code : e instanceof Error ? e.message : "INTERNAL_ERROR";
        return (t.errors as Record<string, string>)[code] ?? t.errors.INTERNAL_ERROR;
      },
      formatDateTime: (iso) =>
        new Date(iso).toLocaleString(locale, { timeZone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
      formatDay: (d) => d.toLocaleDateString(locale, { timeZone, weekday: "long", day: "numeric", month: "long" }),
      formatTime: (d) => d.toLocaleTimeString(locale, { timeZone, hour: "numeric", minute: "2-digit" }),
      money: (n) => `${Math.round(n)} ${t.common.sar}`,
      authReady,
      user,
      signIn,
      signOut,
      setUser,
    };
  }, [lang, authReady, user, signIn, signOut]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const v = useContext(AppContext);
  if (!v) throw new Error("useApp outside Providers");
  return v;
}
