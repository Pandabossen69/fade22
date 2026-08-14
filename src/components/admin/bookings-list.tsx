"use client";

import { useState } from "react";
import { useLang } from "../language-context";
import { getService } from "@/lib/services";
import { formatPhoneDisplay } from "@/lib/validation";
import { bangkokToday } from "@/lib/slots";
import type { Booking } from "@/lib/types";
import {
  AdminStats,
  formatBaht,
  formatCount,
  formatMonthHeading,
  sumPrices,
} from "./admin-stats";

function byTimeAsc(a: Booking, b: Booking): number {
  return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
}

function groupPastByMonth(past: Booking[]): [string, Booking[]][] {
  const map = new Map<string, Booking[]>();
  for (const b of past) {
    const key = b.date.slice(0, 7);
    const list = map.get(key);
    if (list) list.push(b);
    else map.set(key, [b]);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export function BookingsList({ bookings: initial }: { bookings: Booking[] }) {
  const { t, lang } = useLang();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = bangkokToday();
  const todays = items.filter((b) => b.date === today).slice().sort(byTimeAsc);
  const later = items.filter((b) => b.date > today).slice().sort(byTimeAsc);
  const past = items.filter((b) => b.date < today);
  const pastMonths = groupPastByMonth(past);

  async function cancel(id: string) {
    const ok = window.confirm(lang === "en" ? "Cancel this booking?" : "ยกเลิกคิวนี้?");
    if (!ok) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/bookings?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return;
      setItems((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  function row(b: Booking) {
    const s = getService(b.serviceId);
    const svc = s ? (lang === "en" ? s.nameEn : s.nameTh) : b.serviceId;
    return (
      <li key={b.id} className="border border-line bg-bg2 px-4 py-3">
        <p className="flex items-baseline justify-between gap-3">
          <span className="tabular-nums text-gold2">
            {b.date} {b.time}
          </span>
          <span className="text-sm">{svc}</span>
        </p>
        <p className="mt-1 text-sm">
          {b.name} · {formatPhoneDisplay(b.phone)}
        </p>
        {b.notes ? <p className="mt-1 text-[12px] text-dim">{b.notes}</p> : null}
        <button
          type="button"
          disabled={busyId === b.id}
          onClick={() => cancel(b.id)}
          className="focus-ring mt-3 flex min-h-11 w-full items-center justify-center border border-line px-4 text-[12px] tracking-[0.14em] uppercase text-muted hover:border-danger hover:text-danger disabled:opacity-40"
        >
          {t("adminCancel")}
        </button>
      </li>
    );
  }

  return (
    <div>
      <AdminStats bookings={items} />

      <section className="mb-10">
        <p className="kicker mb-4">{t("adminTitle")}</p>
        {todays.length === 0 ? (
          <p className="text-sm text-muted">{t("adminEmptyToday")}</p>
        ) : (
          <ul className="space-y-2">{todays.map(row)}</ul>
        )}
        {later.length ? <ul className="mt-6 space-y-2">{later.map(row)}</ul> : null}
      </section>

      {pastMonths.length ? (
        <section className="mb-4">
          <p className="kicker mb-4">{t("adminHistory")}</p>
          <div className="space-y-8">
            {pastMonths.map(([month, rows]) => (
              <div key={month}>
                <p className="text-base text-ink">{formatMonthHeading(month, lang)}</p>
                <p className="mt-1 mb-3 text-sm tabular-nums text-muted">
                  {formatCount(rows.length, lang)} · {formatBaht(sumPrices(rows))}
                </p>
                <ul className="space-y-2">{rows.map(row)}</ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
