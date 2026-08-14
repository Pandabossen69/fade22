import { NextResponse } from "next/server";
import { upcomingBookings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const bookings = await upcomingBookings();
  return NextResponse.json({ bookings });
}
