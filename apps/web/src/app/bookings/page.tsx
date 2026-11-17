"use client";

import type { Booking } from "@airport/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookingCard } from "@/components/BookingCard";
import { RequireAuth } from "@/components/LoginForm";
import { Button, cx, ErrorBox, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useApp } from "@/lib/providers";

const ACTIVE = ["PENDING", "CONFIRMED", "DRIVER_ASSIGNED", "ON_THE_WAY"];

function BookingsList() {
  const { t, errorText } = useApp();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const load = () => {
    setError(null);
    api
      .bookings()
      .then((r) => setBookings(r.bookings))
      .catch((e) => setError(errorText(e)));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!bookings && !error) return <Spinner />;
  const upcoming = (bookings ?? []).filter((b) => ACTIVE.includes(b.status)).sort((a, b) => a.pickupAt.localeCompare(b.pickupAt));
  const past = (bookings ?? []).filter((b) => !ACTIVE.includes(b.status));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">{t.bookings.title}</h1>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-brand-soft p-1">
        {(["upcoming", "past"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cx("rounded-lg py-2 font-semibold", tab === k ? "bg-brand text-white" : "text-brand")}
          >
            {t.bookings[k]} ({(k === "upcoming" ? upcoming : past).length})
          </button>
        ))}
      </div>
      <ErrorBox>{error}</ErrorBox>
      {error ? (
        <Button variant="secondary" onClick={load}>
          {t.common.retry}
        </Button>
      ) : null}
      {list.map((b) => (
        <BookingCard key={b.id} booking={b} />
      ))}
      {bookings && list.length === 0 ? (
        <div className="space-y-4 py-12 text-center">
          <p className="text-muted">{t.bookings.empty}</p>
          <Link href="/" className="inline-flex rounded-xl bg-brand px-5 py-3 font-bold text-white">
            {t.bookings.newBooking}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <RequireAuth>
      <BookingsList />
    </RequireAuth>
  );
}
