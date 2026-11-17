"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/providers";
import { cx } from "./ui";

export function Header() {
  const { t, lang, setLang } = useApp();
  const path = usePathname();
  const links = [
    { href: "/", label: t.tabs.book },
    { href: "/bookings", label: t.tabs.bookings },
    { href: "/account", label: t.tabs.account },
  ];
  return (
    <header className="bg-brand text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="text-2xl text-accent" aria-hidden>
            ✈
          </span>
          {t.appName}
        </Link>
        <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", active ? "bg-white/15" : "text-white/80 hover:text-white")}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="ms-auto rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10"
        >
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>
    </header>
  );
}
