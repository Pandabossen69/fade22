import { promises as fs } from "fs";
import path from "path";
import type { Booking, ServiceId } from "./types";
import type { Review } from "./reviews";

const dataDir = path.join(process.cwd(), "data");
const bookingsFile = "bookings.json";
const reviewsFile = "reviews.json";

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
type ReviewsFileShape = { reviews: Review[] };

function useBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
}

const blobPutOpts = {
  access: "private" as const,
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "application/json",
  cacheControlMaxAge: 60,
};

async function streamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(stream).text();
}

async function blobRead(pathname: string): Promise<string | null> {
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return await streamText(result.stream);
  } catch {
    return null;
  }
}

async function blobWrite(pathname: string, body: string): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(pathname, body, blobPutOpts);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
}

async function fileRead(name: string): Promise<string | null> {
  await ensureDir();
  try {
    return await fs.readFile(path.join(dataDir, name), "utf8");
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return null;
    throw err;
  }
}

async function fileWrite(name: string, body: string): Promise<void> {
  await ensureDir();
  const full = path.join(dataDir, name);
  const tmp = `${full}.${process.pid}.tmp`;
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, full);
}

async function readRaw(name: string): Promise<string | null> {
  if (useBlobStore()) return blobRead(name);
  return fileRead(name);
}

async function writeRaw(name: string, body: string): Promise<void> {
  if (useBlobStore()) {
    await blobWrite(name, body);
    return;
  }
  await fileWrite(name, body);
}

function parseBookings(raw: string | null): FileShape {
  if (!raw) return { bookings: [] };
  try {
    const parsed = JSON.parse(raw) as FileShape;
    if (!parsed || !Array.isArray(parsed.bookings)) return { bookings: [] };
    return parsed;
  } catch {
    return { bookings: [] };
  }
}

function parseReviews(raw: string | null): ReviewsFileShape {
  if (!raw) return { reviews: [] };
  try {
    const parsed = JSON.parse(raw) as ReviewsFileShape;
    if (!parsed || !Array.isArray(parsed.reviews)) return { reviews: [] };
    return parsed;
  } catch {
    return { reviews: [] };
  }
}

async function readBookings(): Promise<FileShape> {
  return parseBookings(await readRaw(bookingsFile));
}

async function writeBookings(data: FileShape): Promise<void> {
  await writeRaw(bookingsFile, JSON.stringify(data, null, 2) + "\n");
}

async function readReviews(): Promise<ReviewsFileShape> {
  return parseReviews(await readRaw(reviewsFile));
}

async function writeReviews(data: ReviewsFileShape): Promise<void> {
  await writeRaw(reviewsFile, JSON.stringify(data, null, 2) + "\n");
}

function overlaps(bookings: Booking[], date: string, slotStarts: string[], exceptId?: string): boolean {
  const want = new Set(slotStarts);
  for (const b of bookings) {
    if (b.date !== date) continue;
    if (exceptId && b.id === exceptId) continue;
    for (const s of b.slotStarts) {
      if (want.has(s)) return true;
    }
  }
  return false;
}

export class ConflictError extends Error {
  constructor() {
    super("Slot already booked");
    this.name = "ConflictError";
  }
}

export async function listBookings(): Promise<Booking[]> {
  const data = await readBookings();
  return data.bookings;
}

export async function takenSlotStarts(date: string): Promise<string[]> {
  const data = await readBookings();
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

    for (let attempt = 0; attempt < 5; attempt++) {
      const data = await readBookings();
      if (overlaps(data.bookings, input.date, input.slotStarts)) {
        throw new ConflictError();
      }
      data.bookings.push(booking);
      await writeBookings(data);

      const verify = await readBookings();
      const mine = verify.bookings.some((b) => b.id === booking.id);
      const clash = overlaps(verify.bookings, input.date, input.slotStarts, booking.id);
      if (mine && !clash) return booking;
      if (clash && mine) throw new ConflictError();
    }

    throw new ConflictError();
  });
}

export async function listStoredReviews(): Promise<Review[]> {
  const data = await readReviews();
  return data.reviews;
}

export async function createReview(input: {
  name: string;
  quoteTh: string;
  quoteEn: string;
  stars: Review["stars"];
}): Promise<Review> {
  return withLock(async () => {
    const review: Review = {
      id: crypto.randomUUID(),
      name: input.name,
      quoteTh: input.quoteTh,
      quoteEn: input.quoteEn,
      stars: input.stars,
      source: "shop",
    };
    for (let attempt = 0; attempt < 5; attempt++) {
      const data = await readReviews();
      data.reviews.unshift(review);
      await writeReviews(data);
      const verify = await readReviews();
      if (verify.reviews.some((r) => r.id === review.id)) return review;
    }
    return review;
  });
}

export async function deleteReview(id: string): Promise<boolean> {
  return withLock(async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const data = await readReviews();
      const next = data.reviews.filter((r) => r.id !== id);
      if (next.length === data.reviews.length) return false;
      data.reviews = next;
      await writeReviews(data);
      const verify = await readReviews();
      if (!verify.reviews.some((r) => r.id === id)) return true;
    }
    return false;
  });
}
