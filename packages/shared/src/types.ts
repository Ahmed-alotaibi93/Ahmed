export type Direction = "TO_AIRPORT" | "FROM_AIRPORT";
export type BookingStatus = "PENDING" | "CONFIRMED" | "DRIVER_ASSIGNED" | "ON_THE_WAY" | "COMPLETED" | "CANCELLED";

export interface Airport {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  lat: number;
  lng: number;
}

export interface VehicleClass {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  seats: number;
  bags: number;
}

export interface PriceBreakdown {
  baseFare: number;
  distanceFare: number;
  minFareApplied: boolean;
  nightSurcharge: number;
  total: number;
}

export interface QuoteOption {
  vehicleClassId: number;
  code: string;
  nameAr: string;
  nameEn: string;
  seats: number;
  bags: number;
  price: PriceBreakdown;
}

export interface Quote {
  airport: Airport;
  distanceKm: number;
  distanceSource: "google" | "estimate";
  options: QuoteOption[];
}

export interface User {
  id: number;
  phone: string;
  name: string | null;
}

export interface Booking {
  id: number;
  direction: Direction;
  address: string;
  lat: number;
  lng: number;
  pickupAt: string;
  flightNumber: string | null;
  passengers: number;
  bags: number;
  distanceKm: number;
  price: number;
  status: BookingStatus;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  airport: Airport;
  vehicleClass: VehicleClass;
}

export interface Place {
  label: string;
  lat: number;
  lng: number;
}
