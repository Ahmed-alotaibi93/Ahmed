"use client";

import type { BookingStatus } from "@airport/shared";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { useApp } from "@/lib/providers";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-2xl border border-line bg-white p-5 space-y-4", className)}>{children}</section>;
}

type Variant = "primary" | "secondary" | "danger" | "accent";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand/90",
  accent: "bg-accent text-ink hover:bg-accent/90",
  secondary: "bg-white text-brand border border-line hover:bg-brand-soft",
  danger: "bg-white text-danger border border-danger hover:bg-red-50",
};

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-bold transition disabled:opacity-50",
        variants[variant],
        className,
      )}
    >
      {loading ? <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  );
}

export function Field({ label, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <input
        {...props}
        className={cx(
          "w-full rounded-xl border border-line bg-white px-3 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/15",
          className,
        )}
      />
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="text-sm font-semibold">{children}</div>;
}

export function ErrorBox({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
      {children}
    </div>
  );
}

export function Chip({ selected, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={cx(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition",
        selected ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/40",
      )}
    >
      {children}
    </button>
  );
}

export function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const btn = "grid size-9 place-items-center rounded-full border border-line text-lg text-brand disabled:opacity-30";
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`${label} -`} className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <span className="w-6 text-center text-lg font-bold">{value}</span>
        <button type="button" aria-label={`${label} +`} className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

const statusStyles: Record<BookingStatus, string> = {
  PENDING: "text-amber-700 border-amber-600",
  CONFIRMED: "text-brand border-brand",
  DRIVER_ASSIGNED: "text-brand border-brand",
  ON_THE_WAY: "text-success border-success",
  COMPLETED: "text-success border-success",
  CANCELLED: "text-muted border-muted",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useApp();
  return <span className={cx("rounded-full border px-2.5 py-0.5 text-xs font-semibold", statusStyles[status])}>{t.status[status]}</span>;
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium sm:text-end">{value}</dd>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-16">
      <span className="size-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    </div>
  );
}
