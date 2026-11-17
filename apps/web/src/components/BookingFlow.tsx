"use client";

import { ksaDays, slotsForDay, type KsaDay, type Airport, type Direction, type Place, type Quote, type QuoteOption } from "@airport/shared";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/providers";
import { AddressPicker } from "./AddressPicker";
import { LoginForm } from "./LoginForm";
import { Button, Card, Chip, cx, ErrorBox, Field, InfoRow, Label, Stepper } from "./ui";

const FLIGHT_RE = /^[A-Z0-9]{2}\s?\d{1,4}[A-Z]?$/;
type Step = "form" | "vehicle" | "review";

export function BookingFlow() {
  const app = useApp();
  const { t, lang, errorText, formatDay, formatTime, money, user } = app;
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [airports, setAirports] = useState<Airport[] | null>(null);
  const [direction, setDirection] = useState<Direction>("TO_AIRPORT");
  const [airport, setAirport] = useState<Airport | null>(null);
  const [location, setLocation] = useState<Place | null>(null);
  const [details, setDetails] = useState("");
  // الأيام تُحسب في المتصفح (بعد التحميل) عشان ما تتجمد وقت بناء الصفحة
  const [days, setDays] = useState<KsaDay[]>([]);
  const [dayKey, setDayKey] = useState("");
  const [pickupIso, setPickupIso] = useState("");
  const [flight, setFlight] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [bags, setBags] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [option, setOption] = useState<QuoteOption | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = ksaDays(14);
    setDays(d);
    setDayKey(d[0].key);
    api
      .airports()
      .then((r) => setAirports(r.airports))
      .catch((e) => setError(errorText(e)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const day = days.find((d) => d.key === dayKey) ?? days[0];
  const slots = useMemo(() => (day ? slotsForDay(day) : []), [day]);
  const pickupAt = pickupIso ? new Date(pickupIso) : null;
  const toAirport = direction === "TO_AIRPORT";
  const airportName = airport ? (lang === "ar" ? airport.nameAr : airport.nameEn) : "";
  const address = [location?.label, details.trim()].filter(Boolean).join(" — ");

  function go(s: Step) {
    setError(null);
    setStep(s);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function seePrices(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const f = flight.trim().toUpperCase();
    if (!airport) return setError(t.book.chooseAirport);
    if (!location) return setError(t.errors.MISSING_ADDRESS);
    if (!pickupAt) return setError(t.book.time);
    if (!toAirport && !f) return setError(t.errors.MISSING_FLIGHT);
    if (f && !FLIGHT_RE.test(f)) return setError(t.book.flightNumberHint);
    setFlight(f);
    setLoading(true);
    try {
      const q = await api.quote({ airportId: airport.id, lat: location.lat, lng: location.lng, pickupAt: pickupAt.toISOString() });
      setQuote(q);
      setOption(q.options.find((o) => o.seats >= passengers && o.bags >= bags) ?? null);
      go("vehicle");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!airport || !location || !pickupAt || !option) return;
    setError(null);
    setLoading(true);
    try {
      const { booking } = await api.createBooking({
        airportId: airport.id,
        lat: location.lat,
        lng: location.lng,
        pickupAt: pickupAt.toISOString(),
        direction,
        address,
        vehicleClassId: option.vehicleClassId,
        flightNumber: flight || undefined,
        passengers,
        bags,
        notes: notes.trim() || undefined,
      });
      router.push(`/bookings/${booking.id}?created=1`);
    } catch (err) {
      setError(errorText(err));
      setLoading(false);
    }
  }

  const back = (s: Step) => (
    <button type="button" onClick={() => go(s)} className="text-sm font-semibold text-brand hover:underline">
      {lang === "ar" ? "→" : "←"} {t.common.back}
    </button>
  );

  if (step === "vehicle" && quote) {
    return (
      <div className="space-y-4">
        <div ref={topRef} className="scroll-mt-4" />
        {back("form")}
        <h2 className="text-xl font-extrabold">{t.vehicle.title}</h2>
        <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-5">
          <div>
            <div className="text-sm text-muted">{t.vehicle.distance}</div>
            <div className="text-lg font-bold">
              {quote.distanceKm} {t.vehicle.km}
            </div>
          </div>
          {quote.distanceSource === "estimate" ? <span className="text-sm text-muted">{t.vehicle.estimateNote}</span> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
          {quote.options.map((o) => {
            const fits = o.seats >= passengers && o.bags >= bags;
            const selected = option?.vehicleClassId === o.vehicleClassId;
            return (
              <button
                key={o.vehicleClassId}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!fits}
                onClick={() => setOption(o)}
                className={cx(
                  "flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 text-start transition disabled:opacity-45",
                  selected ? "border-2 border-brand bg-brand-soft" : "border-line hover:border-brand/40",
                )}
              >
                <div>
                  <div className="text-lg font-bold">{lang === "ar" ? o.nameAr : o.nameEn}</div>
                  <div className="text-sm text-muted">
                    {o.seats} {t.vehicle.seats} · {o.bags} {t.vehicle.bags}
                  </div>
                  {!fits ? <div className="text-sm text-danger">{t.vehicle.tooSmall}</div> : null}
                  {o.price.nightSurcharge > 0 ? <div className="text-sm text-muted">{t.vehicle.nightNote}</div> : null}
                </div>
                <div className="text-xl font-extrabold whitespace-nowrap">{money(o.price.total)}</div>
              </button>
            );
          })}
        </div>
        <Button className="w-full" disabled={!option} onClick={() => go("review")}>
          {t.vehicle.continue}
          {option ? ` · ${money(option.price.total)}` : ""}
        </Button>
      </div>
    );
  }

  if (step === "review" && quote && option && pickupAt) {
    return (
      <div className="space-y-4">
        <div ref={topRef} className="scroll-mt-4" />
        {back("vehicle")}
        <h2 className="text-xl font-extrabold">{t.review.title}</h2>
        <Card>
          <dl className="space-y-3">
            <InfoRow label={toAirport ? t.book.pickupAddress : t.book.airport} value={toAirport ? address : airportName} />
            <InfoRow label={toAirport ? t.book.airport : t.book.dropoffAddress} value={toAirport ? airportName : address} />
            <InfoRow label={t.review.pickupTime} value={app.formatDateTime(pickupAt)} />
            {flight ? <InfoRow label={t.book.flightNumber} value={flight} /> : null}
            <InfoRow
              label={t.review.vehicle}
              value={`${lang === "ar" ? option.nameAr : option.nameEn} · ${passengers} ${t.vehicle.seats} · ${bags} ${t.vehicle.bags}`}
            />
            <InfoRow label={`${t.vehicle.distance}`} value={`${quote.distanceKm} ${t.vehicle.km}`} />
            <InfoRow label={t.review.payment} value={t.review.cash} />
          </dl>
          {option.price.nightSurcharge > 0 ? <p className="text-sm text-muted">{t.vehicle.nightNote}</p> : null}
          <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold">
            <span>{t.review.total}</span>
            <span>{money(option.price.total)}</span>
          </div>
        </Card>
        <Card>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{t.review.notes}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-brand"
            />
          </label>
        </Card>
        <ErrorBox>{error}</ErrorBox>
        {user ? (
          <Button className="w-full" loading={loading} onClick={confirm}>
            ✓ {t.review.confirm} · {money(option.price.total)}
          </Button>
        ) : (
          <LoginForm />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={seePrices} className="space-y-4">
      <div ref={topRef} className="scroll-mt-4" />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-brand-soft p-1" role="tablist">
        {(["TO_AIRPORT", "FROM_AIRPORT"] as const).map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={direction === d}
            onClick={() => setDirection(d)}
            className={cx("rounded-lg py-2.5 font-semibold", direction === d ? "bg-brand text-white" : "text-brand")}
          >
            {d === "TO_AIRPORT" ? `✈ ${t.book.toAirport}` : `🚘 ${t.book.fromAirport}`}
          </button>
        ))}
      </div>

      <Card>
        <Label>{t.book.airport}</Label>
        {airports ? (
          <div className="flex flex-wrap gap-2">
            {airports.map((a) => (
              <Chip key={a.id} selected={airport?.id === a.id} onClick={() => setAirport(a)}>
                {lang === "ar" ? a.cityAr : a.cityEn} · {a.code}
              </Chip>
            ))}
          </div>
        ) : (
          <div className="h-10 animate-pulse rounded-xl bg-brand-soft" />
        )}
        {airport ? <p className="text-sm text-muted">{airportName}</p> : null}
      </Card>

      <Card>
        <Label>{toAirport ? t.book.pickupAddress : t.book.dropoffAddress}</Label>
        <AddressPicker
          value={location}
          near={airport ? { lat: airport.lat, lng: airport.lng } : undefined}
          onChange={setLocation}
        />
        <Field label={t.book.addressDetails} value={details} maxLength={150} onChange={(e) => setDetails(e.target.value)} />
      </Card>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{t.book.date}</span>
            <select
              value={dayKey}
              onChange={(e) => {
                setDayKey(e.target.value);
                setPickupIso("");
              }}
              className="w-full rounded-xl border border-line bg-white px-3 py-3"
            >
              {days.map((d, i) => (
                <option key={d.key} value={d.key}>
                  {i === 0 ? `${t.book.today} — ` : i === 1 ? `${t.book.tomorrow} — ` : ""}
                  {formatDay(d.noon)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{t.book.time}</span>
            <select
              value={pickupIso}
              onChange={(e) => setPickupIso(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-3"
            >
              <option value="">—</option>
              {slots.map((s) => (
                <option key={s.toISOString()} value={s.toISOString()}>
                  {formatTime(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <Field
          label={toAirport ? t.book.flightNumberOptional : t.book.flightNumber}
          hint={t.book.flightNumberHint}
          value={flight}
          maxLength={8}
          dir="ltr"
          className="text-start uppercase"
          onChange={(e) => setFlight(e.target.value)}
        />
        <Stepper label={t.book.passengers} value={passengers} min={1} max={12} onChange={setPassengers} />
        <Stepper label={t.book.bags} value={bags} min={0} max={10} onChange={setBags} />
      </Card>

      <ErrorBox>{error}</ErrorBox>
      <Button type="submit" variant="accent" className="w-full text-lg" loading={loading} disabled={!airports}>
        {t.book.seePrices}
      </Button>
    </form>
  );
}
