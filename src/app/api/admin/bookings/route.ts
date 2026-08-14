import { NextRequest, NextResponse } from "next/server";
import { deleteBooking, upcomingBookings } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

export async function GET() {
  const bookings = await upcomingBookings();
  return NextResponse.json({ bookings }, noStore);
}

export async function DELETE(req: NextRequest) {
  const id = sanitizeText(req.nextUrl.searchParams.get("id") ?? "", 80);
  if (!id) return NextResponse.json({ error: "invalid" }, { status: 400, ...noStore });
  const ok = await deleteBooking(id);
  if (!ok) return NextResponse.json({ error: "missing" }, { status: 404, ...noStore });
  return NextResponse.json({ ok: true }, noStore);
}
