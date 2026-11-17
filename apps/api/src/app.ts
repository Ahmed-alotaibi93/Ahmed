import "express-async-errors";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { bookingsRouter } from "./routes/bookings.js";
import { errorHandler } from "./lib/errors.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/auth", authRouter);
  app.use("/", catalogRouter);
  app.use("/bookings", bookingsRouter);
  app.use(errorHandler);
  return app;
}
