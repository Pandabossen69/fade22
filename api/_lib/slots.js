// Tider och lediga starttider. Thailand har ingen sommartid, så Bangkok = UTC+7 året runt.
import { shop, getService, slotsFor } from './shop.js';

export const pad2 = (n) => String(n).padStart(2, '0');
export const toMin = (hm) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
export const toHm = (min) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
export const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
export const isHm = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** Bangkoks datum (ÅÅÅÅ-MM-DD) och minut på dygnet just nu. */
export function bangkokNow(now = Date.now()) {
  const d = new Date(now + shop.utcOffsetMin * 60000);
  return {
    date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    min: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

export function addDays(date, n) {
  const d = new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Alla 30-minutersstarter under en öppen dag: 09:00, 09:30 … 20:30. */
export function daySlots() {
  const out = [];
  for (let t = toMin(shop.open); t + shop.slotMinutes <= toMin(shop.close); t += shop.slotMinutes) out.push(toHm(t));
  return out;
}

/** De slotar en bokning med start `time` upptar, eller null om den inte ryms före stängning. */
export function occupiedSlots(time, service) {
  const all = daySlots();
  const i = all.indexOf(time);
  const n = slotsFor(service);
  if (i < 0 || i + n > all.length) return null;
  return all.slice(i, i + n);
}

/** Datumet går att boka: idag eller framåt, högst bookDaysAhead dagar bort. */
export function bookableDate(date, now = Date.now()) {
  if (!isDate(date)) return false;
  const today = bangkokNow(now).date;
  return date >= today && date <= addDays(today, shop.bookDaysAhead - 1);
}

/** Starttider för en tjänst en dag: [{ time, free }]. Passerade tider idag tas bort. */
export function listStarts(serviceId, date, taken, now = Date.now()) {
  const service = getService(serviceId);
  if (!service || !bookableDate(date, now)) return [];
  const { date: today, min } = bangkokNow(now);
  const out = [];
  for (const time of daySlots()) {
    if (date === today && toMin(time) <= min) continue;
    const occ = occupiedSlots(time, service);
    if (!occ) continue;
    out.push({ time, free: occ.every((s) => !taken.has(s)) });
  }
  return out;
}
