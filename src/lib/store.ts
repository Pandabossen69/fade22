import { promises as fs } from "fs";
import path from "path";
import type { Booking, ServiceId } from "./types";

const dataDir = path.join(process.cwd(), "data");
const fileName = "bookings.json";

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

type FileShape = { bookings: Booking[] };

async function ensureDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readJson(): Promise<FileShape> {
  await ensureDir();
  const full = path.join(dataDir, fileName);
  try {
    const raw = await fs.readFile(full, "utf8");
    const parsed = JSON.parse(raw) as FileShape;
    if (!parsed || !Array.isArray(parsed.bookings)) return { bookings: [] };
    return parsed;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return { bookings: [] };
    throw err;
  }
}

async function writeJson(data: FileShape): Promise<void> {
  await ensureDir();
  const full = path.join(dataDir, fileName);
  const tmp = `${full}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, full);
}

export class ConflictError extends Error {
  constructor() {
    super("Slot already booked");
    this.name = "ConflictError";
  }
}

export async function listBookings(): Promise<Booking[]> {
  const data = await readJson();
  return data.bookings;
}

export async function takenSlotStarts(date: string): Promise<string[]> {
  const data = await readJson();
  const set = new Set<string>();
  for (const b of data.bookings) {
    if (b.date !== date) continue;
    for (const s of b.slotStarts) set.add(s);
  }
  return [...set].sort();
}

export async function createBooking(input: {
  name: string;
  phone: string;
  serviceId: ServiceId;
  date: string;
  time: string;
  slotStarts: string[];
  notes: string;
}): Promise<Booking> {
  return withLock(async () => {
    const data = await readJson();
    const occupied = new Set<string>();
    for (const b of data.bookings) {
      if (b.date !== input.date) continue;
      for (const s of b.slotStarts) occupied.add(s);
    }
    for (const s of input.slotStarts) {
      if (occupied.has(s)) throw new ConflictError();
    }
    const booking: Booking = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: input.name,
      phone: input.phone,
      serviceId: input.serviceId,
      date: input.date,
      time: input.time,
      slotStarts: input.slotStarts,
      notes: input.notes,
    };
    data.bookings.push(booking);
    await writeJson(data);
    return booking;
  });
}
