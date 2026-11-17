import type { Airport, Booking, Place, Quote, User } from "@airport/shared";

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "INTERNAL_ERROR");
  return data as T;
}

export interface QuoteRequest {
  airportId: number;
  lat: number;
  lng: number;
  pickupAt: string;
}

export interface CreateBookingRequest extends QuoteRequest {
  direction: "TO_AIRPORT" | "FROM_AIRPORT";
  address: string;
  vehicleClassId: number;
  flightNumber?: string;
  passengers: number;
  bags: number;
  notes?: string;
}

export const api = {
  requestOtp: (phone: string) => request<{ ok: true; phone: string; devCode?: string }>("/auth/request-otp", { body: { phone } }),
  verifyOtp: (phone: string, code: string) => request<{ token: string; user: User }>("/auth/verify-otp", { body: { phone, code } }),
  me: () => request<{ user: User }>("/auth/me"),
  updateMe: (name: string) => request<{ user: User }>("/auth/me", { method: "PATCH", body: { name } }),
  airports: () => request<{ airports: Airport[] }>("/airports"),
  searchPlaces: (q: string, near?: { lat: number; lng: number }, lang = "ar") => {
    const p = new URLSearchParams({ q, lang });
    if (near) {
      p.set("lat", String(near.lat));
      p.set("lng", String(near.lng));
    }
    return request<{ places: Place[] }>(`/places/search?${p}`);
  },
  quote: (body: QuoteRequest) => request<Quote>("/quotes", { body }),
  createBooking: (body: CreateBookingRequest) => request<{ booking: Booking }>("/bookings", { body }),
  bookings: () => request<{ bookings: Booking[] }>("/bookings"),
  booking: (id: number) => request<{ booking: Booking }>(`/bookings/${id}`),
  cancelBooking: (id: number) => request<{ booking: Booking }>(`/bookings/${id}/cancel`, { method: "POST" }),
};
