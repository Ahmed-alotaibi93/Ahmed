"use client";

import type { Place } from "@airport/shared";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/providers";
import { Button, ErrorBox } from "./ui";

export function AddressPicker({
  value,
  near,
  onChange,
}: {
  value: Place | null;
  near?: { lat: number; lng: number };
  onChange: (p: Place | null) => void;
}) {
  const { t, lang, errorText } = useApp();
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
  }, [query, near?.lat, near?.lng, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  function locate() {
    setError(null);
    if (!navigator.geolocation) return setError(t.book.locationDenied);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange({ label: t.book.myLocation, lat: pos.coords.latitude, lng: pos.coords.longitude });
        setQuery("");
        setResults([]);
      },
      () => {
        setLocating(false);
        setError(t.book.locationDenied);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
        <span className="text-xl text-accent" aria-hidden>
          ●
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{value.label}</div>
          <div className="text-xs text-muted" dir="ltr">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </div>
        </div>
        <button type="button" aria-label="clear" onClick={() => onChange(null)} className="px-2 text-xl text-muted hover:text-ink">
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.book.searchAddress}
          className="w-full rounded-xl border border-line bg-white px-3 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        {searching ? (
          <span className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        ) : null}
      </div>
      {results.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {results.map((p, i) => (
            <li key={`${p.lat},${p.lng},${i}`}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-start text-sm hover:bg-brand-soft"
                onClick={() => {
                  onChange(p);
                  setQuery("");
                  setResults([]);
                }}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim().length >= 2 && !searching && !error ? (
        <p className="text-sm text-muted">{t.book.noResults}</p>
      ) : null}
      <ErrorBox>{error}</ErrorBox>
      <Button type="button" variant="secondary" className="w-full" loading={locating} onClick={locate}>
        ⌖ {t.book.myLocation}
      </Button>
    </div>
  );
}
