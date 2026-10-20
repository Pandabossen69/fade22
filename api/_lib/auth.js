// Inloggning för butiken (/admin). Ett lösenord i miljövariabeln ADMIN_PASSWORD; inget reservlösenord i koden.
// Sessionen är en signerad cookie (HttpOnly, Secure, SameSite=Strict) som gäller i 30 dagar på butikens telefon.
import { hmac, safeEqual } from './http.js';

const COOKIE = 'adc_admin';
const MAX_AGE = 60 * 60 * 24 * 30;

const password = () => process.env.ADMIN_PASSWORD || '';
const secret = () => process.env.SESSION_SECRET || `adc:${password()}`;

export const adminConfigured = () => password().length >= 6;
export const passwordOk = (input) => adminConfigured() && safeEqual(input, password());

export function sessionCookie(secure) {
  const exp = Date.now() + MAX_AGE * 1000;
  const value = `${exp}.${hmac(secret(), String(exp))}`;
  return `${COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
}

export const clearCookie = (secure) => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;

export function isAdmin(req) {
  if (!adminConfigured()) return false;
  const raw = (req.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(sig, hmac(secret(), exp));
}

export const isHttps = (req) => new URL(req.url).protocol === 'https:';
