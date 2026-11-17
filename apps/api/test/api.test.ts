import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();
let token = "";
let airportId = 0;
const olaya = { lat: 24.6907, lng: 46.6853 };
const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

beforeAll(async () => {
  const r1 = await request(app).post("/auth/request-otp").send({ phone: "0501234567" });
  expect(r1.status).toBe(200);
  const bad = await request(app).post("/auth/verify-otp").send({ phone: "0501234567", code: "000000" });
  expect(bad.status).toBe(400);
  const r2 = await request(app).post("/auth/verify-otp").send({ phone: "0501234567", code: r1.body.devCode });
  expect(r2.status).toBe(200);
  token = r2.body.token;
  const airports = await request(app).get("/airports");
  airportId = airports.body.airports.find((a: { code: string }) => a.code === "RUH").id;
});

describe("catalog", () => {
  it("lists Saudi airports", async () => {
    const r = await request(app).get("/airports");
    expect(r.body.airports.length).toBeGreaterThanOrEqual(10);
  });

  it("quotes every vehicle class", async () => {
    const r = await request(app).post("/quotes").send({ airportId, ...olaya, pickupAt: inHours(5) });
    expect(r.status).toBe(200);
    expect(r.body.distanceKm).toBeGreaterThan(35);
    expect(r.body.options).toHaveLength(4);
  });

  it("rejects far addresses and too-soon pickups", async () => {
    const jeddah = { lat: 21.5, lng: 39.2 };
    const far = await request(app).post("/quotes").send({ airportId, ...jeddah, pickupAt: inHours(5) });
    expect(far.body.error).toBe("DISTANCE_TOO_FAR");
    const soon = await request(app).post("/quotes").send({ airportId, ...olaya, pickupAt: inHours(0.2) });
    expect(soon.body.error).toBe("PICKUP_TOO_SOON");
  });
});

describe("bookings", () => {
  const base = () => ({
    airportId,
    ...olaya,
    pickupAt: inHours(6),
    address: "حي العليا، الرياض",
    passengers: 2,
    bags: 2,
  });

  it("requires auth", async () => {
    const r = await request(app).get("/bookings");
    expect(r.status).toBe(401);
  });

  it("requires flight number for airport pickups", async () => {
    const r = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...base(), direction: "FROM_AIRPORT", vehicleClassId: 1 });
    expect(r.status).toBe(400);
  });

  it("creates, lists and cancels a booking with server-side price", async () => {
    const quote = await request(app).post("/quotes").send({ airportId, ...olaya, pickupAt: base().pickupAt });
    const economy = quote.body.options[0];
    const created = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...base(), direction: "TO_AIRPORT", vehicleClassId: economy.vehicleClassId, price: 1 });
    expect(created.status).toBe(201);
    expect(created.body.booking.price).toBe(economy.price.total);
    expect(created.body.booking.status).toBe("PENDING");

    const list = await request(app).get("/bookings").set("Authorization", `Bearer ${token}`);
    expect(list.body.bookings).toHaveLength(1);

    const cancel = await request(app)
      .post(`/bookings/${created.body.booking.id}/cancel`)
      .set("Authorization", `Bearer ${token}`);
    expect(cancel.body.booking.status).toBe("CANCELLED");
  });

  it("rejects too many passengers for the class", async () => {
    const r = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...base(), passengers: 6, direction: "TO_AIRPORT", vehicleClassId: 1 });
    expect(r.body.error).toBe("TOO_MANY_PASSENGERS");
  });
});
