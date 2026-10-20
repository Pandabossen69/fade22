// POST /api/cancel { ref, action: "view" | "cancel" }
// Kunden avbokar själv med länken från bekräftelsen (/cancel/#<id>.<nyckel>). Barberaren behöver inte svara i telefon.
// Nyckeln sparas bara som hash. Avbokning går fram till starttiden.
import { deleteBooking, listBookings } from './_lib/store.js';
import { notify } from './_lib/notify.js';
import { bangkokNow, toMin } from './_lib/slots.js';
import { json, rateOk, readJson, safeEqual, sha256, text } from './_lib/http.js';

function parseRef(ref) {
  const m = /^([0-9a-f-]{36})\.([\w-]{16,64})$/.exec(text(ref, 120));
  return m ? { id: m[1], hash: sha256(m[2]) } : null;
}

function upcoming(b) {
  const now = bangkokNow();
  return b.date > now.date || (b.date === now.date && toMin(b.time) > now.min);
}

export async function POST(req) {
  if (!rateOk(req, 'cancel', 20)) return json({ error: 'rate' }, 429);
  const body = await readJson(req);
  const ref = body && parseRef(body.ref);
  if (!ref) return json({ error: 'missing' }, 404);
  const owns = (b) => b.kind !== 'block' && typeof b.cancelHash === 'string' && safeEqual(b.cancelHash, ref.hash);

  if (body.action !== 'cancel') {
    const b = (await listBookings()).find((x) => x.id === ref.id && owns(x));
    if (!b) return json({ error: 'missing' }, 404);
    return json({ booking: { serviceId: b.serviceId, date: b.date, time: b.time, name: b.name }, cancellable: upcoming(b) });
  }

  const removed = await deleteBooking(ref.id, (b) => owns(b) && upcoming(b));
  if (!removed) return json({ error: 'missing' }, 404);
  await notify('cancel', removed);
  return json({ ok: true });
}
