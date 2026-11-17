"use client";

import type { Booking } from "@airport/shared";
import Link from "next/link";
import { useApp } from "@/lib/providers";
import { StatusBadge } from "./ui";

export function BookingCard({ booking }: { booking: Booking }) {
  const { t, lang, money, formatDateTime } = useApp();
  const toAirport = booking.direction === "TO_AIRPORT";
  const city = lang === "ar" ? booking.airport.cityAr : booking.airport.cityEn;
  return (
    <Link href={`/bookings/${booking.id}`} className="block space-y-2 rounded-2xl border border-line bg-white p-4 hover:border-brand/40">
      <div className="flex items-start justify-between gap-3">
        <div className="font-bold">
          {toAirport ? `✈ ${t.book.toAirport}` : `🚘 ${t.book.fromAirport}`} · {city} ({booking.airport.code})
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="text-sm text-muted">{formatDateTime(booking.pickupAt)}</div>
      <div className="truncate">{booking.address}</div>
      <div className="flex justify-between">
        <span className="text-sm text-muted">{lang === "ar" ? booking.vehicleClass.nameAr : booking.vehicleClass.nameEn}</span>
        <span className="font-extrabold">{money(booking.price)}</span>
      </div>
    </Link>
  );
}
