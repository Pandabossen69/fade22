"use client";

import Link from "next/link";
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

function StepBar({ step, onBack }: { step: Step; onBack?: () => void }) {
  const { t } = useLang();
  return (
    <div className="sticky top-14 z-20 -mx-4 mb-8 flex items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur-md">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="focus-ring flex min-h-12 min-w-[8.5rem] items-center gap-2 px-3 text-base font-medium text-ink"
        >
          <span aria-hidden="true">←</span>
          {t("back")}
        </button>
      ) : (
        <span className="min-h-12 min-w-[8.5rem]" />
      )}
      <div className="flex items-center gap-3">
        <span className="tabular-nums text-sm text-muted">{step} / 3</span>
        <span className="flex gap-1.5" aria-hidden="true">
          {([1, 2, 3] as const).map((n) => (
            <span
              key={n}
              className={`h-2.5 w-2.5 rounded-full ${n === step ? "bg-gold" : n < step ? "bg-gold2" : "bg-line"}`}
            />
          ))}
        </span>
      </div>
    </div>
  );
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
        <Link
          href="/"
          className="focus-ring mt-8 flex h-12 min-w-[8.5rem] items-center justify-center gap-2 border border-line bg-bg2 px-5 text-base font-medium text-ink hover:border-gold/55"
        >
          <span aria-hidden="true">←</span>
          {t("backHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="kicker mb-2">{t("navBook")}</p>

      {step === 1 ? (
        <div>
          <StepBar step={1} />
          <p className="mb-4 text-sm text-muted">{t("labelService")}</p>
          <ul className="grid gap-3">
            {services.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setServiceId(s.id);
                    setStep(2);
                  }}
                  className="focus-ring flex w-full items-center justify-between gap-3 border border-line bg-bg2 px-5 py-5 text-left transition-colors hover:border-gold/55 hover:bg-elev"
                >
                  <span className="flex min-w-0 items-baseline gap-4">
                    <span className="hidden w-6 shrink-0 font-mono text-[11px] tabular-nums text-dim sm:inline">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block text-lg leading-tight">{lang === "en" ? s.nameEn : s.nameTh}</span>
                      <span className="mt-1 block text-[12px] text-dim">
                        {s.durationMin} {t("minutes")}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-lg tabular-nums text-gold">฿{s.priceThb}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === 2 && service ? (
        <div>
          <StepBar step={2} onBack={() => setStep(1)} />
          <p className="mb-6 text-sm text-muted">
            {lang === "en" ? service.nameEn : service.nameTh} · ฿{service.priceThb}
          </p>
          <p className="mb-3 text-sm text-muted">{t("labelDate")}</p>
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                className={`focus-ring min-w-[3.4rem] border px-2 py-3 text-center ${
                  date === d ? "border-gold bg-gold text-black" : "border-line bg-bg2 text-muted"
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
                  time === hm ? "border-gold bg-gold text-black" : "border-line bg-bg2 text-ink hover:border-gold"
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
          <StepBar step={3} onBack={() => setStep(2)} />
          <p className="text-sm text-muted">
            {lang === "en" ? service.nameEn : service.nameTh} · {date} · {time}
          </p>
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
