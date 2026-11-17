"use client";

import type { Booking } from "@airport/shared";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/providers";
import { Button, Card, ErrorBox, InfoRow, Spinner, StatusBadge } from "./ui";

const CANCEL_CUTOFF_MS = 2 * 3600_000;

export function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const created = useSearchParams().get("created");
  const { t, lang, money, formatDateTime, errorText } = useApp();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .booking(Number(id))
      .then((r) => setBooking(r.booking))
      .catch((e) => setError(errorText(e)));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!booking) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />;

  const toAirport = booking.direction === "TO_AIRPORT";
  const airportName = lang === "ar" ? booking.airport.nameAr : booking.airport.nameEn;
  const canCancel =
    ["PENDING", "CONFIRMED"].includes(booking.status) && new Date(booking.pickupAt).getTime() - Date.now() > CANCEL_CUTOFF_MS;

  async function cancel() {
    if (!window.confirm(t.detail.cancelConfirm)) return;
    setError(null);
    setCancelling(true);
    try {
      setBooking((await api.cancelBooking(booking!.id)).booking);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/bookings" className="text-sm font-semibold text-brand hover:underline">
        {lang === "ar" ? "→" : "←"} {t.bookings.title}
      </Link>
      {created && booking.status !== "CANCELLED" ? (
        <div className="rounded-xl bg-green-50 px-4 py-3 font-bold text-success">✓ {t.review.success}</div>
      ) : null}
      <Card>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold">
            {t.detail.bookingNo} {booking.id}
          </h1>
          <StatusBadge status={booking.status} />
        </div>
        <dl className="space-y-3">
          <InfoRow label={toAirport ? t.book.pickupAddress : t.book.airport} value={toAirport ? booking.address : airportName} />
          <InfoRow label={toAirport ? t.book.airport : t.book.dropoffAddress} value={toAirport ? airportName : booking.address} />
          <InfoRow label={t.review.pickupTime} value={formatDateTime(booking.pickupAt)} />
          {booking.flightNumber ? <InfoRow label={t.book.flightNumber} value={booking.flightNumber} /> : null}
          <InfoRow
            label={t.review.vehicle}
            value={`${lang === "ar" ? booking.vehicleClass.nameAr : booking.vehicleClass.nameEn} · ${booking.passengers} ${t.vehicle.seats} · ${booking.bags} ${t.vehicle.bags}`}
          />
          <InfoRow label={t.detail.distance} value={`${booking.distanceKm} ${t.vehicle.km}`} />
          <InfoRow label={t.review.payment} value={t.review.cash} />
          {booking.notes ? <InfoRow label={t.review.notes} value={booking.notes} /> : null}
        </dl>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold">
          <span>{t.review.total}</span>
          <span>{money(booking.price)}</span>
        </div>
      </Card>
      <ErrorBox>{error}</ErrorBox>
      {canCancel ? (
        <div className="space-y-2 text-center">
          <Button variant="danger" className="w-full" loading={cancelling} onClick={cancel}>
            {t.detail.cancel}
          </Button>
          <p className="text-sm text-muted">{t.detail.cancelPolicy}</p>
        </div>
      ) : null}
    </div>
  );
}
