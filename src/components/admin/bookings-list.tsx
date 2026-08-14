"use client";

import { useState } from "react";
import { useLang } from "../language-context";
import { getService } from "@/lib/services";
import { formatPhoneDisplay } from "@/lib/validation";
import { bangkokToday } from "@/lib/slots";
import type { Booking } from "@/lib/types";

export function BookingsList({ bookings: initial }: { bookings: Booking[] }) {
  const { t, lang } = useLang();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = bangkokToday();
  const todays = items.filter((b) => b.date === today);
  const later = items.filter((b) => b.date > today);

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
      <p className="kicker mb-4">{t("adminTitle")}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{t("adminEmpty")}</p>
      ) : (
        <>
          <ul className="space-y-2">{todays.map(row)}</ul>
          {later.length ? <ul className="mt-6 space-y-2">{later.map(row)}</ul> : null}
        </>
      )}
    </div>
  );
}
