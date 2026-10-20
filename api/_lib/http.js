// Små hjälpare för API-funktionerna (Web-standard Request/Response, körs som Vercel Functions på Node).
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const NO_STORE = { 'Cache-Control': 'private, no-store' };

export function json(body, status = 200, headers = NO_STORE) {
  return Response.json(body, { status, headers });
}

/** Läser JSON-kroppen. Kräver application/json och samma ursprung, så ett vanligt formulär från en annan sajt inte kan posta. */
export async function readJson(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) return null;
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return null;
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

const TAGS = /<\/?[^>]+>/g;
const CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
export function text(v, max, multiline = false) {
  if (typeof v !== 'string') return '';
  let s = v.replace(TAGS, '').replace(CONTROLS, '');
  s = multiline ? s.replace(/\r\n/g, '\n') : s.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

/** Thailändskt mobilnummer: 0[689]xxxxxxxx (+66 godtas och görs om). */
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('66') && d.length === 11) d = `0${d.slice(2)}`;
  return d;
}
export const isThaiMobile = (p) => /^0[689]\d{8}$/.test(p);
export const formatPhone = (p) => (p.length === 10 ? `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}` : p);

// Enkel spärr mot spam per instans (räcker för en butik; Vercel-instanser lever minuter–timmar).
const hits = new Map();
export function rateOk(req, bucket, max = 12, windowMs = 15 * 60 * 1000) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'okänd';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  const ok = list.length < max;
  if (ok) list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return ok;
}

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const token = (bytes = 18) => randomBytes(bytes).toString('base64url');
export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
export const hmac = (secret, value) => createHmac('sha256', secret).update(value).digest('base64url');
