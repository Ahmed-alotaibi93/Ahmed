export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || undefined,
  isProd: process.env.NODE_ENV === "production",
};
