// Bokningarna sparas som EN json-fil.
//   På Vercel: privat Vercel Blob "bookings.json" (samma fil och form som förra versionen av sajten, så inget går förlorat).
//   Lokalt (npm run dev): data/bookings.json.
// Samtidiga bokningar: skrivningen kräver att filen inte ändrats sedan läsningen (ifMatch/etag). Krockar det läses filen
// om och kollen görs igen, så två kunder kan aldrig få samma tid.
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { addDays, bangkokNow } from './slots.js';

const FILE = 'bookings.json';
const DATA_DIR = join(process.cwd(), 'data');
const KEEP_DAYS = 120; // äldre bokningar rensas vid nästa skrivning (personuppgifter sparas inte längre än nödvändigt)

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
const errName = (e) => (e && typeof e === 'object' && 'name' in e ? String(e.name) : '');

export class ConflictError extends Error {
  constructor() { super('Slot already booked'); this.name = 'ConflictError'; }
}

async function readRaw() {
  if (useBlob()) {
    const { get } = await import('@vercel/blob');
    let r;
    try {
      r = await get(FILE, { access: 'private', useCache: false });
    } catch (e) {
      if (errName(e) === 'BlobNotFoundError') return { text: null };
      throw e;
    }
    if (!r) return { text: null };
    if (r.statusCode !== 200 || !r.stream) throw new Error(`blob get ${FILE} status ${r.statusCode}`);
    return { text: await new Response(r.stream).text(), etag: r.blob.etag };
  }
  try {
    return { text: await fs.readFile(join(DATA_DIR, FILE), 'utf8') };
  } catch (e) {
    if (e.code === 'ENOENT') return { text: null };
    throw e;
  }
}

async function writeRaw(body, etag) {
  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    await put(FILE, body, {
      access: 'private', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60,
      allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}),
    });
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const full = join(DATA_DIR, FILE);
  const tmp = `${full}.${process.pid}.tmp`;
  await fs.writeFile(tmp, body, 'utf8');
  await fs.rename(tmp, full);
}

function retryable(e) {
  const name = errName(e);
  const msg = e instanceof Error ? e.message : '';
  return name === 'BlobPreconditionFailedError' || /precondition|already exists|cannot overwrite|409/i.test(`${name} ${msg}`);
}

async function read() {
  const raw = await readRaw();
  let bookings = [];
  try {
    const parsed = raw.text ? JSON.parse(raw.text) : null;
    if (parsed && Array.isArray(parsed.bookings)) bookings = parsed.bookings;
  } catch { /* trasig fil behandlas som tom, men skrivs aldrig över utan etag-kontroll */ }
  return { bookings, etag: raw.etag };
}

function prune(bookings) {
  const oldest = addDays(bangkokNow().date, -KEEP_DAYS);
  return bookings.filter((b) => b.date >= oldest);
}

// En kö per instans så att den här instansen inte tävlar med sig själv. Mellan instanser skyddar etag.
let chain = Promise.resolve();
function locked(fn) {
  const run = chain.then(fn, fn);
  chain = run.then(() => undefined, () => undefined);
  return run;
}

/** Läs–ändra–skriv med etag. `change` får listan och returnerar { bookings, result } eller kastar. */
function mutate(change) {
  return locked(async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const data = await read();
      const { bookings, result } = change(data.bookings.slice());
      try {
        await writeRaw(JSON.stringify({ bookings: prune(bookings) }, null, 1) + '\n', data.etag);
        return result;
      } catch (e) {
        if (retryable(e)) continue;
        throw e;
      }
    }
    throw new ConflictError();
  });
}

const overlaps = (bookings, date, slots) => {
  const want = new Set(slots);
  return bookings.some((b) => b.date === date && b.slotStarts.some((s) => want.has(s)));
};

export async function listBookings() {
  return (await read()).bookings;
}

export async function takenSlots(date) {
  const set = new Set();
  for (const b of (await read()).bookings) if (b.date === date) for (const s of b.slotStarts) set.add(s);
  return set;
}

/** Ny kundbokning. Kastar ConflictError om någon av slotarna redan är tagen. */
export function createBooking(input) {
  return mutate((bookings) => {
    if (overlaps(bookings, input.date, input.slotStarts)) throw new ConflictError();
    const booking = { id: randomUUID(), createdAt: new Date().toISOString(), kind: 'booking', ...input };
    bookings.push(booking);
    return { bookings, result: booking };
  });
}

/** Admin stänger tider (lunch, ledig dag, telefonbokning). Bara lediga slotar tas; returnerar vilka som stängdes. */
export function createBlock({ date, slotStarts, note }) {
  return mutate((bookings) => {
    const taken = new Set(bookings.filter((b) => b.date === date).flatMap((b) => b.slotStarts));
    const free = slotStarts.filter((s) => !taken.has(s));
    if (!free.length) throw new ConflictError();
    const block = { id: randomUUID(), createdAt: new Date().toISOString(), kind: 'block', date, time: free[0], slotStarts: free, note };
    bookings.push(block);
    return { bookings, result: block };
  });
}

/** Tar bort en bokning. `check(b)` måste godkänna den (t.ex. att kundens avbokningsnyckel stämmer). */
export async function deleteBooking(id, check = () => true) {
  try {
    return await mutate((bookings) => {
      const i = bookings.findIndex((b) => b.id === id);
      if (i < 0 || !check(bookings[i])) throw new NotFound();
      const [removed] = bookings.splice(i, 1);
      return { bookings, result: removed };
    });
  } catch (e) {
    if (e instanceof NotFound) return null;
    throw e;
  }
}

class NotFound extends Error {}
