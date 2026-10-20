// GET  /api/bookings?service=thai&date=2026-10-21  → lediga och tagna starttider den dagen
// GET  /api/bookings?service=thai&next=1           → nästa lediga tid (för "Nästa lediga tid" på startsidan)
// POST /api/bookings  { serviceId, date, time, name, phone, notes, lang }  → bokar, svarar med avbokningsnyckel
import { ConflictError, createBooking, listBookings, takenSlots } from './_lib/store.js';
import { notify } from './_lib/notify.js';
import { getService, shop } from './_lib/shop.js';
import { addDays, bangkokNow, bookableDate, isDate, listStarts, occupiedSlots } from './_lib/slots.js';
import { isThaiMobile, json, normalizePhone, rateOk, readJson, sha256, text, token } from './_lib/http.js';

// Lediga tider får cachas några sekunder i Vercels CDN: färre funktions- och Blob-anrop (= gratis drift).
// Bokningen kontrolleras ändå mot färsk data när den skickas.
const SHORT_CACHE = { 'Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=30' };

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const service = getService(q.get('service') || '');
  if (!service) return json({ error: 'service' }, 400);

  if (q.get('next')) {
    const all = await listBookings();
    const today = bangkokNow().date;
    for (let i = 0; i < shop.bookDaysAhead; i++) {
      const date = addDays(today, i);
      const taken = new Set(all.filter((b) => b.date === date).flatMap((b) => b.slotStarts));
      const free = listStarts(service.id, date, taken).find((s) => s.free);
      if (free) return json({ date, time: free.time }, 200, SHORT_CACHE);
    }
    return json({ date: null }, 200, SHORT_CACHE);
  }

  const date = q.get('date') || '';
  if (!isDate(date)) return json({ error: 'date' }, 400);
  const slots = listStarts(service.id, date, await takenSlots(date));
  return json({ date, slots }, 200, SHORT_CACHE);
}

export async function POST(req) {
  if (!rateOk(req, 'book', 8)) return json({ error: 'rate' }, 429);
  const body = await readJson(req);
  if (!body) return json({ error: 'invalid' }, 400);

  const service = getService(text(body.serviceId, 20));
  const date = text(body.date, 10);
  const time = text(body.time, 5);
  const name = text(body.name, 60);
  const phone = normalizePhone(text(body.phone, 20));
  const notes = text(body.notes, 300, true);
  const lang = body.lang === 'en' ? 'en' : 'th';
  // Honungsfälla: fältet är dolt för människor. Fylls det i är det en bot; svara som om allt gick bra.
  if (text(body.website, 100)) return json({ ok: true });

  const fields = {};
  if (!service) fields.serviceId = 'service';
  if (!bookableDate(date)) fields.date = 'date';
  if (name.length < 2) fields.name = 'name';
  if (!isThaiMobile(phone)) fields.phone = 'phone';
  const slotStarts = service ? occupiedSlots(time, service) : null;
  if (!slotStarts) fields.time = 'time';
  if (Object.keys(fields).length) return json({ error: 'invalid', fields }, 400);

  // Tiden måste fortfarande vara en kommande, ledig start (inte passerad idag).
  const taken = await takenSlots(date);
  const open = listStarts(service.id, date, taken).find((s) => s.time === time);
  if (!open) return json({ error: 'invalid', fields: { time: 'time' } }, 400);
  if (!open.free) return json({ error: 'conflict' }, 409);

  const cancelKey = token();
  try {
    const b = await createBooking({ serviceId: service.id, date, time, slotStarts, name, phone, notes, lang, cancelHash: sha256(cancelKey) });
    await notify('new', b);
    return json({ ok: true, ref: `${b.id}.${cancelKey}`, booking: { serviceId: b.serviceId, date: b.date, time: b.time, name: b.name } });
  } catch (e) {
    if (e instanceof ConflictError) return json({ error: 'conflict' }, 409);
    throw e;
  }
}
