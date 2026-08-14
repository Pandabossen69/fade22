"use client";

import { useLang } from "../language-context";
import { getService } from "@/lib/services";
import { formatPhoneDisplay } from "@/lib/validation";
import { bangkokToday } from "@/lib/slots";
import type { Booking } from "@/lib/types";

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  const { t, lang } = useLang();
  const today = bangkokToday();
  const todays = bookings.filter((b) => b.date === today);
  const later = bookings.filter((b) => b.date > today);

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
      </li>
    );
  }

  return (
    <div>
      <p className="kicker mb-4">{t("adminTitle")}</p>
      <ul className="space-y-2">{todays.map(row)}</ul>
      {later.length ? <ul className="mt-6 space-y-2">{later.map(row)}</ul> : null}
    </div>
  );
}
