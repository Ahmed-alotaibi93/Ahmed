"use client";

import { useApp } from "@/lib/providers";

export function Hero() {
  const { t } = useApp();
  return (
    <section className="space-y-4 rounded-2xl bg-brand p-6 text-white lg:sticky lg:top-6">
      <h1 className="text-2xl leading-snug font-extrabold sm:text-3xl">{t.home.title}</h1>
      <p className="text-white/80">{t.home.subtitle}</p>
      <ul className="space-y-2 pt-2">
        {[t.home.f1, t.home.f2, t.home.f3].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-accent">✓</span>
            {f}
          </li>
        ))}
      </ul>
    </section>
  );
}
