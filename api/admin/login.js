// POST /api/admin/login { password }  → sätter sessionscookien
// DELETE /api/admin/login             → loggar ut
import { adminConfigured, clearCookie, isHttps, passwordOk, sessionCookie } from '../_lib/auth.js';
import { NO_STORE, json, rateOk, readJson, text } from '../_lib/http.js';

export async function POST(req) {
  if (!adminConfigured()) return json({ error: 'not_configured' }, 503);
  if (!rateOk(req, 'login', 8)) return json({ error: 'rate' }, 429);
  const body = await readJson(req);
  if (!body || !passwordOk(text(body.password, 200))) return json({ error: 'password' }, 401);
  return json({ ok: true }, 200, { ...NO_STORE, 'Set-Cookie': sessionCookie(isHttps(req)) });
}

export function DELETE(req) {
  return json({ ok: true }, 200, { ...NO_STORE, 'Set-Cookie': clearCookie(isHttps(req)) });
}
