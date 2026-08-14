/**
 * Persistence facade.
 *
 * Local `next dev`: JSON file at data/bookings.json (atomic write + 409 on conflict).
 * On Vercel: bookings.json / reviews.json in private Blob (BLOB_READ_WRITE_TOKEN).
 */
import {
  ConflictError,
  createBooking as jsonCreate,
  listBookings as jsonList,
  takenSlotStarts as jsonTaken,
  listStoredReviews as jsonListReviews,
  createReview as jsonCreateReview,
  deleteReview as jsonDeleteReview,
  deleteBooking as jsonDeleteBooking,
} from "./store";
import { bangkokToday } from "./slots";
import type { Booking, ServiceId } from "./types";
import type { Review } from "./reviews";

export type { Booking };
export { ConflictError };

export async function listBookings(): Promise<Booking[]> {
  // if (process.env.DATABASE_URL) return supabaseList();
  return jsonList();
}

export async function takenSlotStarts(date: string): Promise<string[]> {
  return jsonTaken(date);
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
  return jsonCreate(input);
}

export async function upcomingBookings(): Promise<Booking[]> {
  const today = bangkokToday();
  const all = await listBookings();
  return all
    .filter((b) => b.date >= today)
    .slice()
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

export async function listStoredReviews(): Promise<Review[]> {
  return jsonListReviews();
}

export async function createReview(input: {
  name: string;
  quoteTh: string;
  quoteEn: string;
  stars: Review["stars"];
}): Promise<Review> {
  return jsonCreateReview(input);
}

export async function deleteReview(id: string): Promise<boolean> {
  return jsonDeleteReview(id);
}

export async function deleteBooking(id: string): Promise<boolean> {
  return jsonDeleteBooking(id);
}

