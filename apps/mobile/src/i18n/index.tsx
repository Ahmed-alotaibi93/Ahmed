import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nManager, Platform } from "react-native";
import { ApiError } from "@/api/client";
import { ar, en, type Strings } from "./strings";

export type Lang = "ar" | "en";

interface I18nValue {
  lang: Lang;
  t: Strings;
  isRTL: boolean;
  setLang: (l: Lang) => void;
  errorText: (e: unknown) => string;
  formatDateTime: (iso: string | Date) => string;
  formatDay: (d: Date) => string;
  formatTime: (d: Date) => string;
  money: (n: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const KEY = "lang";

function applyDirection(lang: Lang) {
  const rtl = lang === "ar";
  if (Platform.OS === "web") {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  } else if (I18nManager.isRTL !== rtl) {
    // على الجوال يتطبق الاتجاه بعد إعادة فتح التطبيق
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const deviceLang: Lang = getLocales()[0]?.languageCode === "en" ? "en" : "ar";
  const [lang, setLangState] = useState<Lang>(deviceLang);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === "ar" || v === "en") setLangState(v);
    });
  }, []);

  useEffect(() => applyDirection(lang), [lang]);

  const value = useMemo<I18nValue>(() => {
    const t = lang === "ar" ? ar : en;
    const locale = lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB";
    const tz = "Asia/Riyadh";
    return {
      lang,
      t,
      isRTL: lang === "ar",
      setLang: (l) => {
        setLangState(l);
        AsyncStorage.setItem(KEY, l);
      },
      errorText: (e) => {
        const code = e instanceof ApiError ? e.code : e instanceof Error ? e.message : "INTERNAL_ERROR";
        return (t.errors as Record<string, string>)[code] ?? t.errors.INTERNAL_ERROR;
      },
      formatDateTime: (iso) =>
        new Date(iso).toLocaleString(locale, {
          timeZone: tz,
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
        }),
      formatDay: (d) => d.toLocaleDateString(locale, { timeZone: tz, weekday: "short", day: "numeric", month: "short" }),
      formatTime: (d) => d.toLocaleTimeString(locale, { timeZone: tz, hour: "numeric", minute: "2-digit" }),
      money: (n) => `${Math.round(n)} ${t.common.sar}`,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n outside provider");
  return v;
}
