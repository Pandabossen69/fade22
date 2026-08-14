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
type RawRead = { text: string | null; etag?: string };
type BookingsState = FileShape & { etag?: string };
type ReviewsState = ReviewsFileShape & { etag?: string };

function useBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
}

const blobPutOpts = {
  access: "private" as const,
  addRandomSuffix: false,
  contentType: "application/json",
  cacheControlMaxAge: 60,
};

function errName(err: unknown): string {
  return err && typeof err === "object" && "name" in err ? String((err as { name: string }).name) : "";
}

function isBlobNotFound(err: unknown): boolean {
  return errName(err) === "BlobNotFoundError";
}

function isRetryableWrite(err: unknown): boolean {
  const name = errName(err);
  if (name === "BlobPreconditionFailedError") return true;
  const msg = err instanceof Error ? err.message : "";
  return /precondition|already exists|cannot overwrite|409/i.test(`${name} ${msg}`);
}

async function streamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(stream).text();
}

async function blobRead(pathname: string): Promise<RawRead> {
  const { get } = await import("@vercel/blob");
  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(pathname, { access: "private", useCache: false });
  } catch (err) {
    if (isBlobNotFound(err)) return { text: null };
    throw err;
  }
  if (!result) return { text: null };
  if (result.statusCode !== 200 || !result.stream) {
    throw new Error(`blob get ${pathname} status ${result.statusCode}`);
  }
  return { text: await streamText(result.stream), etag: result.blob.etag };
}

async function blobWrite(pathname: string, body: string, etag?: string): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(pathname, body, {
    ...blobPutOpts,
    allowOverwrite: Boolean(etag),
    ...(etag ? { ifMatch: etag } : {}),
  });
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

async function readRaw(name: string): Promise<RawRead> {
  if (useBlobStore()) return blobRead(name);
  return { text: await fileRead(name) };
}

async function writeRaw(name: string, body: string, etag?: string): Promise<void> {
  if (useBlobStore()) {
    await blobWrite(name, body, etag);
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

async function readBookings(): Promise<BookingsState> {
  const raw = await readRaw(bookingsFile);
  return { ...parseBookings(raw.text), etag: raw.etag };
}

async function writeBookings(data: BookingsState): Promise<void> {
  await writeRaw(bookingsFile, JSON.stringify({ bookings: data.bookings }, null, 2) + "\n", data.etag);
}

async function readReviews(): Promise<ReviewsState> {
  const raw = await readRaw(reviewsFile);
  return { ...parseReviews(raw.text), etag: raw.etag };
}

async function writeReviews(data: ReviewsState): Promise<void> {
  await writeRaw(reviewsFile, JSON.stringify({ reviews: data.reviews }, null, 2) + "\n", data.etag);
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
      if (data.bookings.some((b) => b.id === booking.id)) {
        if (overlaps(data.bookings, input.date, input.slotStarts, booking.id)) {
          throw new ConflictError();
        }
        return booking;
      }
      if (overlaps(data.bookings, input.date, input.slotStarts)) {
        throw new ConflictError();
      }
      data.bookings.push(booking);
      try {
        await writeBookings(data);
      } catch (err) {
        if (isRetryableWrite(err)) continue;
        throw err;
      }

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
      if (data.reviews.some((r) => r.id === review.id)) return review;
      data.reviews.unshift(review);
      try {
        await writeReviews(data);
      } catch (err) {
        if (isRetryableWrite(err)) continue;
        throw err;
      }
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
      try {
        await writeReviews(data);
      } catch (err) {
        if (isRetryableWrite(err)) continue;
        throw err;
      }
      const verify = await readReviews();
      if (!verify.reviews.some((r) => r.id === id)) return true;
    }
    return false;
  });
}

export async function deleteBooking(id: string): Promise<boolean> {
  return withLock(async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const data = await readBookings();
      const next = data.bookings.filter((b) => b.id !== id);
      if (next.length === data.bookings.length) return false;
      data.bookings = next;
      try {
        await writeBookings(data);
      } catch (err) {
        if (isRetryableWrite(err)) continue;
        throw err;
      }
      const verify = await readBookings();
      if (!verify.bookings.some((b) => b.id === id)) return true;
    }
    return false;
  });
}
