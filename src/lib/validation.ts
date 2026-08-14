import { getService, isServiceId } from "./services";
import { sanitizeMultiline, sanitizeText } from "./sanitize";
import {
  availableStarts,
  isDateString,
  isValidStart,
  slotStartsForService,
} from "./slots";
import type { BookingInput, ServiceId } from "./types";

const PHONE = /^0[689]\d{8}$/;

export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("66") && d.length === 11) d = `0${d.slice(2)}`;
  return d;
}

export function formatPhoneDisplay(raw: string): string {
  const d = normalizePhone(raw);
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}

export function isShopPhone(raw: string): boolean {
  return PHONE.test(normalizePhone(raw));
}

export type FieldErrors = Record<string, string>;

export function parseBooking(
  body: unknown,
  taken: Set<string>,
): { ok: true; data: BookingInput; slotStarts: string[] } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (!body || typeof body !== "object") return { ok: false, errors: { form: "invalid" } };
  const b = body as Record<string, unknown>;

  const name = sanitizeText(b.name, 80);
  const phone = normalizePhone(sanitizeText(b.phone, 20));
  const serviceRaw = sanitizeText(b.serviceId, 40);
  const date = sanitizeText(b.date, 12);
  const time = sanitizeText(b.time, 8);
  const notes = sanitizeMultiline(b.notes, 300);

  if (name.length < 2) errors.name = "name";
  if (!isShopPhone(phone)) errors.phone = "phone";
  if (!isServiceId(serviceRaw)) errors.serviceId = "service";
  if (!isDateString(date)) errors.date = "date";
  if (!/^\d{2}:\d{2}$/.test(time)) errors.time = "time";

  if (Object.keys(errors).length) return { ok: false, errors };

  const serviceId = serviceRaw as ServiceId;
  const service = getService(serviceId)!;
  if (!isValidStart(time, service)) {
    return { ok: false, errors: { time: "time" } };
  }
  const open = availableStarts(serviceId, date, taken);
  if (!open.includes(time)) {
    return { ok: false, errors: { time: "taken" } };
  }

  return {
    ok: true,
    data: { name, phone, serviceId, date, time, notes },
    slotStarts: slotStartsForService(time, service),
  };
}
