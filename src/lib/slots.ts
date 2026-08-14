import { site } from "./site";
import { getService } from "./services";
import type { Service } from "./types";

const TZ = "Asia/Bangkok";

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function minutesToHm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function allSlotStarts(): string[] {
  const start = hmToMinutes(site.open);
  const last = hmToMinutes(site.lastSlot);
  const out: string[] = [];
  for (let t = start; t <= last; t += site.slotMinutes) {
    out.push(minutesToHm(t));
  }
  return out;
}

export function slotStartsForService(startHm: string, service: Service): string[] {
  const start = hmToMinutes(startHm);
  const slots: string[] = [];
  for (let i = 0; i < service.slotCount; i++) {
    slots.push(minutesToHm(start + i * site.slotMinutes));
  }
  return slots;
}

export function isValidStart(startHm: string, service: Service): boolean {
  const starts = new Set(allSlotStarts());
  if (!starts.has(startHm)) return false;
  const occupied = slotStartsForService(startHm, service);
  const last = hmToMinutes(site.lastSlot);
  for (const s of occupied) {
    if (!starts.has(s)) return false;
    if (hmToMinutes(s) > last) return false;
  }
  return true;
}

export function bangkokNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}

export function bangkokToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function bangkokHm(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function isDateString(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function dateInPast(date: string): boolean {
  return date < bangkokToday();
}

export function slotInPast(date: string, hm: string): boolean {
  const today = bangkokToday();
  if (date < today) return true;
  if (date > today) return false;
  return hmToMinutes(hm) <= hmToMinutes(bangkokHm());
}

export function upcomingDays(count = 14): string[] {
  const today = bangkokToday();
  const [y, mo, d] = today.split("-").map(Number);
  const days: string[] = [];
  const utc = Date.UTC(y, mo - 1, d);
  for (let i = 0; i < count; i++) {
    const dt = new Date(utc + i * 86400000);
    days.push(
      `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`,
    );
  }
  return days;
}

export function availableStarts(
  serviceId: string,
  date: string,
  taken: Set<string>,
): string[] {
  const service = getService(serviceId);
  if (!service || dateInPast(date)) return [];
  return allSlotStarts().filter((start) => {
    if (!isValidStart(start, service)) return false;
    if (slotInPast(date, start)) return false;
    return slotStartsForService(start, service).every((s) => !taken.has(s));
  });
}
