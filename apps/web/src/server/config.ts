const isProd = process.env.NODE_ENV === "production";

export const config = {
  isProd,
  get jwtSecret() {
    const s = process.env.JWT_SECRET;
    if (!s && isProd) throw new Error("JWT_SECRET is not set");
    return s ?? "dev-secret-change-me";
  },
  get googleMapsKey() {
    return process.env.GOOGLE_MAPS_API_KEY || undefined;
  },
  /** يظهر رمز التحقق في الرد (للتطوير والتجربة قبل ربط مزود SMS) */
  get showDevOtp() {
    return !isProd || process.env.OTP_DEV_MODE === "true";
  },
};
