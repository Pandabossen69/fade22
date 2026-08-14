import { promises as fs } from "fs";
import path from "path";
import type { Booking, ServiceId } from "./types";
import type { Review } from "./reviews";

const dataDir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const fileName = "bookings.json";
const reviewsFileName = "reviews.json";

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

async function readReviewsJson(): Promise<ReviewsFileShape> {
  await ensureDir();
  const full = path.join(dataDir, reviewsFileName);
  try {
    const raw = await fs.readFile(full, "utf8");
    const parsed = JSON.parse(raw) as ReviewsFileShape;
    if (!parsed || !Array.isArray(parsed.reviews)) return { reviews: [] };
    return parsed;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return { reviews: [] };
    throw err;
  }
}

async function writeReviewsJson(data: ReviewsFileShape): Promise<void> {
  await ensureDir();
  const full = path.join(dataDir, reviewsFileName);
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

export async function listStoredReviews(): Promise<Review[]> {
  const data = await readReviewsJson();
  return data.reviews;
}

export async function createReview(input: {
  name: string;
  quoteTh: string;
  quoteEn: string;
  stars: Review["stars"];
}): Promise<Review> {
  return withLock(async () => {
    const data = await readReviewsJson();
    const review: Review = {
      id: crypto.randomUUID(),
      name: input.name,
      quoteTh: input.quoteTh,
      quoteEn: input.quoteEn,
      stars: input.stars,
      source: "shop",
    };
    data.reviews.unshift(review);
    await writeReviewsJson(data);
    return review;
  });
}

export async function deleteReview(id: string): Promise<boolean> {
  return withLock(async () => {
    const data = await readReviewsJson();
    const next = data.reviews.filter((r) => r.id !== id);
    if (next.length === data.reviews.length) return false;
    data.reviews = next;
    await writeReviewsJson(data);
    return true;
  });
}
