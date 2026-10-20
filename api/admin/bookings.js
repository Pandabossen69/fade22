// Butikens egen vy (/admin). Kräver inloggning.
// GET                                   → bokningar från 7 dagar bakåt och framåt + om notiser är på
// POST   { date, from, to, note }       → stäng tider (lunch, ledig dag, telefonbokning)
// DELETE ?id=…                          → ta bort en bokning eller stängd tid
import { isAdmin } from '../_lib/auth.js';
import { ConflictError, createBlock, deleteBooking, listBookings } from '../_lib/store.js';
import { notifyTopic } from '../_lib/notify.js';
import { addDays, bangkokNow, daySlots, isDate, isHm, toMin } from '../_lib/slots.js';
import { json, readJson, text } from '../_lib/http.js';

const deny = () => json({ error: 'auth' }, 401);

export async function GET(req) {
  if (!isAdmin(req)) return deny();
  const from = addDays(bangkokNow().date, -7);
  const bookings = (await listBookings())
    .filter((b) => b.date >= from)
    .map(({ cancelHash, ...b }) => b)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const topic = notifyTopic();
  return json({ bookings, now: bangkokNow(), notify: topic ? `https://ntfy.sh/${topic}` : null });
}

export async function POST(req) {
  if (!isAdmin(req)) return deny();
  const body = await readJson(req);
  const date = text(body?.date, 10);
  const from = text(body?.from, 5);
  const to = text(body?.to, 5);
  if (!isDate(date) || !isHm(from) || !isHm(to) || toMin(to) <= toMin(from)) return json({ error: 'invalid' }, 400);
  const slots = daySlots().filter((s) => toMin(s) >= toMin(from) && toMin(s) < toMin(to));
  if (!slots.length) return json({ error: 'invalid' }, 400);
  try {
    const block = await createBlock({ date, slotStarts: slots, note: text(body.note, 80) });
    return json({ ok: true, block });
  } catch (e) {
    if (e instanceof ConflictError) return json({ error: 'conflict' }, 409);
    throw e;
  }
}

export async function DELETE(req) {
  if (!isAdmin(req)) return deny();
  const id = text(new URL(req.url).searchParams.get('id'), 40);
  if (!id) return json({ error: 'invalid' }, 400);
  const removed = await deleteBooking(id);
  return removed ? json({ ok: true }) : json({ error: 'missing' }, 404);
}
