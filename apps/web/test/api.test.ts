import { beforeAll, describe, expect, it } from "vitest";
import * as requestOtp from "@/app/api/auth/request-otp/route";
import * as verifyOtp from "@/app/api/auth/verify-otp/route";
import * as airports from "@/app/api/airports/route";
import * as quotes from "@/app/api/quotes/route";
import * as bookings from "@/app/api/bookings/route";
import * as cancel from "@/app/api/bookings/[id]/cancel/route";

let token = "";
let airportId = 0;
// رقم مختلف كل تشغيل عشان الاختبارات تشتغل على نفس قاعدة البيانات بدون مسح
const phone = `05${String(Date.now()).slice(-8)}`;
const olaya = { lat: 24.6907, lng: 46.6853 };
const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

function req(body?: unknown, auth = true) {
  return new Request("http://test/api", {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", ...(auth && token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}
const call = async (res: Promise<Response>) => {
  const r = await res;
  return { status: r.status, body: await r.json(), headers: r.headers };
};
const noCtx = undefined as never;

beforeAll(async () => {
  const r1 = await call(requestOtp.POST(req({ phone }), noCtx));
  expect(r1.status).toBe(200);
  const bad = await call(verifyOtp.POST(req({ phone, code: "000000" }), noCtx));
  expect(bad.status).toBe(400);
  const r2 = await call(verifyOtp.POST(req({ phone, code: r1.body.devCode }), noCtx));
  expect(r2.status).toBe(200);
  token = r2.body.token;
  const list = await call(airports.GET(req(), noCtx));
  airportId = list.body.airports.find((a: { code: string }) => a.code === "RUH").id;
});

describe("catalog", () => {
  it("lists Saudi airports with CORS headers", async () => {
    const r = await call(airports.GET(req(), noCtx));
    expect(r.body.airports.length).toBeGreaterThanOrEqual(10);
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("quotes every vehicle class", async () => {
    const r = await call(quotes.POST(req({ airportId, ...olaya, pickupAt: inHours(5) }), noCtx));
    expect(r.status).toBe(200);
    expect(r.body.distanceKm).toBeGreaterThan(35);
    expect(r.body.options).toHaveLength(4);
  });

  it("rejects far addresses and too-soon pickups", async () => {
    const far = await call(quotes.POST(req({ airportId, lat: 21.5, lng: 39.2, pickupAt: inHours(5) }), noCtx));
    expect(far.body.error).toBe("DISTANCE_TOO_FAR");
    const soon = await call(quotes.POST(req({ airportId, ...olaya, pickupAt: inHours(0.2) }), noCtx));
    expect(soon.body.error).toBe("PICKUP_TOO_SOON");
  });
});

describe("bookings", () => {
  const base = () => ({ airportId, ...olaya, pickupAt: inHours(6), address: "حي العليا، الرياض", passengers: 2, bags: 2 });

  it("requires auth", async () => {
    const r = await call(bookings.GET(req(undefined, false), noCtx));
    expect(r.status).toBe(401);
  });

  it("requires flight number for airport pickups", async () => {
    const r = await call(bookings.POST(req({ ...base(), direction: "FROM_AIRPORT", vehicleClassId: 1 }), noCtx));
    expect(r.status).toBe(400);
  });

  it("creates, lists and cancels a booking with server-side price", async () => {
    const quote = await call(quotes.POST(req({ airportId, ...olaya, pickupAt: base().pickupAt }), noCtx));
    const economy = quote.body.options[0];
    const created = await call(
      bookings.POST(req({ ...base(), direction: "TO_AIRPORT", vehicleClassId: economy.vehicleClassId, price: 1 }), noCtx),
    );
    expect(created.status).toBe(201);
    expect(created.body.booking.price).toBe(economy.price.total);
    expect(created.body.booking.status).toBe("PENDING");

    const list = await call(bookings.GET(req(), noCtx));
    expect(list.body.bookings).toHaveLength(1);

    const id = String(created.body.booking.id);
    const c = await call(cancel.POST(req({}), { params: Promise.resolve({ id }) }));
    expect(c.body.booking.status).toBe("CANCELLED");
  });

  it("rejects too many passengers for the class", async () => {
    const r = await call(bookings.POST(req({ ...base(), passengers: 6, direction: "TO_AIRPORT", vehicleClassId: 1 }), noCtx));
    expect(r.body.error).toBe("TOO_MANY_PASSENGERS");
  });
});
