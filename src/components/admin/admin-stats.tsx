"use client";

import { getService } from "@/lib/services";
import { bangkokToday } from "@/lib/slots";
import type { Booking, Lang } from "@/lib/types";
import { useLang } from "../language-context";

export function sumPrices(bookings: Booking[]): number {
  return bookings.reduce((n, b) => n + (getService(b.serviceId)?.priceThb ?? 0), 0);
}

export function formatBaht(n: number): string {
  return `฿${n.toLocaleString("en-US")}`;
}

export function formatCount(n: number, lang: Lang): string {
  if (lang === "en") return `${n} ${n === 1 ? "booking" : "bookings"}`;
  return `${n} คิว`;
}

export function formatMonthHeading(yyyyMm: string, lang: Lang): string {
  const dt = new Date(`${yyyyMm}-01T12:00:00+07:00`);
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(dt);
}

export function AdminStats({ bookings }: { bookings: Booking[] }) {
  const { t, lang } = useLang();
  const month = bangkokToday().slice(0, 7);
  const monthItems = bookings.filter((b) => b.date.startsWith(month));
  const count = monthItems.length;
  const total = sumPrices(monthItems);

  return (
    <div className="mb-8 border border-line bg-bg2 px-4 py-5">
      <p className="kicker mb-3">{t("adminThisMonth")}</p>
      <p className="text-2xl font-medium tabular-nums text-ink">{formatCount(count, lang)}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-gold2">{formatBaht(total)}</p>
    </div>
  );
}
