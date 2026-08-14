"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "./language-context";
import { services } from "@/lib/services";
import { upcomingDays } from "@/lib/slots";
import { formatPhoneDisplay, normalizePhone } from "@/lib/validation";
import type { ServiceId } from "@/lib/types";

type Step = 1 | 2 | 3;

function weekday(date: string, lang: "th" | "en"): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-GB", {
    weekday: "short",
    timeZone: "UTC",
  }).format(dt);
}

function dayNum(date: string): string {
  return date.slice(8);
}

export function BookForm({ initialService }: { initialService?: string }) {
  const { t, lang } = useLang();
  const days = useMemo(() => upcomingDays(14), []);
  const first = services.some((s) => s.id === initialService)
    ? (initialService as ServiceId)
    : null;

  const [step, setStep] = useState<Step>(first ? 2 : 1);
  const [serviceId, setServiceId] = useState<ServiceId | null>(first);
  const [date, setDate] = useState(days[0] ?? "");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!serviceId || !date) return;
    let ignore = false;
    setTime("");
    fetch(`/api/bookings?date=${date}&service=${serviceId}`)
      .then((r) => r.json())
      .then((j: { available?: string[] }) => {
        if (!ignore) setSlots(Array.isArray(j.available) ? j.available : []);
      })
      .catch(() => {
        if (!ignore) setSlots([]);
      });
    return () => {
      ignore = true;
    };
  }, [serviceId, date]);

  const service = services.find((s) => s.id === serviceId) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !date || !time) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: normalizePhone(phone),
          serviceId,
          date,
          time,
          notes,
        }),
      });
      if (res.status === 409) {
        setErr("409");
        setStep(2);
        const j = await fetch(`/api/bookings?date=${date}&service=${serviceId}`).then((r) => r.json());
        setSlots(Array.isArray(j.available) ? j.available : []);
        setTime("");
        return;
      }
      if (!res.ok) {
        setErr("err");
        return;
      }
      setDone(true);
    } catch {
      setErr("err");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="kicker mb-4">{t("navBook")}</p>
        <p className="text-2xl leading-snug text-gold2">{t("success")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="kicker mb-2">{t("navBook")}</p>
      <div className="hairline mb-8" />

      {step === 1 ? (
        <div>
          <p className="mb-4 text-sm text-muted">{t("labelService")}</p>
          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setServiceId(s.id);
                    setStep(2);
                  }}
                  className="focus-ring flex w-full items-baseline justify-between gap-3 border border-line bg-bg2 px-4 py-4 text-left hover:border-gold"
                >
                  <span>
                    <span className="block">{lang === "en" ? s.nameEn : s.nameTh}</span>
                    <span className="text-[11px] text-dim">{s.durationMin} {t("minutes")}</span>
                  </span>
                  <span className="tabular-nums text-gold">฿{s.priceThb}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === 2 && service ? (
        <div>
          <button type="button" className="mb-4 text-[11px] tracking-[0.16em] uppercase text-gold" onClick={() => setStep(1)}>
            {lang === "en" ? service.nameEn : service.nameTh} · ฿{service.priceThb}
          </button>
          <p className="mb-3 text-sm text-muted">{t("labelDate")}</p>
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                className={`focus-ring min-w-[3.4rem] border px-2 py-3 text-center ${
                  date === d ? "border-gold bg-gold text-black" : "border-line text-muted"
                }`}
              >
                <span className="block text-[10px] tracking-[0.12em] uppercase">{weekday(d, lang)}</span>
                <span className="block text-lg tabular-nums">{dayNum(d)}</span>
              </button>
            ))}
          </div>
          <p className="mb-3 text-sm text-muted">{t("labelTime")}</p>
          <div className="grid grid-cols-4 gap-2">
            {slots.map((hm) => (
              <button
                key={hm}
                type="button"
                onClick={() => {
                  setTime(hm);
                  setStep(3);
                }}
                className={`focus-ring border py-3 text-sm tabular-nums ${
                  time === hm ? "border-gold bg-gold text-black" : "border-line text-ink hover:border-gold"
                }`}
              >
                {hm}
              </button>
            ))}
          </div>
          <p className="mt-8 text-[11px] tracking-[0.12em] uppercase text-dim">{t("lateLine")}</p>
        </div>
      ) : null}

      {step === 3 && service ? (
        <form onSubmit={submit} className="space-y-5">
          <button type="button" className="text-[11px] tracking-[0.16em] uppercase text-gold" onClick={() => setStep(2)}>
            {date} · {time}
          </button>
          <div>
            <label htmlFor="name" className="mb-1 block text-[11px] tracking-[0.14em] uppercase text-muted">
              {t("labelName")}
            </label>
            <input
              id="name"
              required
              autoComplete="name"
              placeholder={t("placeholderName")}
              className="focus-ring w-full border border-line bg-bg2 px-3 py-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-[11px] tracking-[0.14em] uppercase text-muted">
              {t("labelPhone")}
            </label>
            <input
              id="phone"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("placeholderPhone")}
              className="focus-ring w-full border border-line bg-bg2 px-3 py-3 tabular-nums"
              value={phone}
              onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="notes" className="mb-1 block text-[11px] tracking-[0.14em] uppercase text-muted">
              {t("labelNotes")}
            </label>
            <textarea
              id="notes"
              rows={2}
              placeholder={t("placeholderNotes")}
              className="focus-ring w-full border border-line bg-bg2 px-3 py-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {err ? <p className="h-px bg-danger" /> : null}
          <button
            type="submit"
            disabled={busy}
            className="focus-ring flex h-12 w-full items-center justify-center bg-gold text-[13px] tracking-[0.22em] uppercase text-black disabled:opacity-40"
          >
            {t("submit")}
          </button>
          <p id="pdpa" className="pt-4 text-[11px] leading-relaxed text-dim">
            {t("pdpa")}
          </p>
        </form>
      ) : null}
    </div>
  );
}
