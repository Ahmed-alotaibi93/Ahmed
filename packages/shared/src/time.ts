/** كل الأوقات بتوقيت السعودية (UTC+3، بدون توقيت صيفي) */
const KSA_OFFSET_MS = 3 * 3600_000;
export const MIN_LEAD_MINUTES = 60;
export const SLOT_MINUTES = 30;

export interface KsaDay {
  key: string; // YYYY-MM-DD
  y: number;
  m: number; // 0-11
  d: number;
  /** منتصف النهار بتوقيت السعودية — للعرض فقط */
  noon: Date;
}

export function ksaDays(count: number, now = new Date()): KsaDay[] {
  const k = new Date(now.getTime() + KSA_OFFSET_MS);
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() + i));
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth();
    const d = dt.getUTCDate();
    return {
      key: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      y,
      m,
      d,
      noon: new Date(Date.UTC(y, m, d, 12 - 3)),
    };
  });
}

/** الأوقات المتاحة في يوم معين (كل نصف ساعة، وبعد ساعة من الآن على الأقل) */
export function slotsForDay(day: KsaDay, now = new Date()): Date[] {
  const earliest = now.getTime() + MIN_LEAD_MINUTES * 60_000;
  const slots: Date[] = [];
  for (let min = 0; min < 24 * 60; min += SLOT_MINUTES) {
    const t = new Date(Date.UTC(day.y, day.m, day.d, 0, min) - KSA_OFFSET_MS);
    if (t.getTime() >= earliest) slots.push(t);
  }
  return slots;
}

export function ksaDayKey(date: Date): string {
  const k = new Date(date.getTime() + KSA_OFFSET_MS);
  return `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, "0")}-${String(k.getUTCDate()).padStart(2, "0")}`;
}
