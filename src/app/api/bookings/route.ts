import { NextRequest, NextResponse } from "next/server";
import { ConflictError, createBooking, takenSlotStarts } from "@/lib/db";
import { notifyNewBooking } from "@/lib/notify";
import { availableStarts, isDateString } from "@/lib/slots";
import { parseBooking } from "@/lib/validation";
import { isServiceId } from "@/lib/services";
import { clientKey, rateLimitOk } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const service = req.nextUrl.searchParams.get("service") ?? "";
  if (!isDateString(date)) {
    return NextResponse.json({ error: "date" }, { status: 400 });
  }
  const taken = new Set(await takenSlotStarts(date));
  if (service && isServiceId(service)) {
    return NextResponse.json({ available: availableStarts(service, date, taken) });
  }
  return NextResponse.json({ taken: [...taken] });
}

export async function POST(req: NextRequest) {
  if (!rateLimitOk(`book:${clientKey(req.headers)}`)) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const date =
    body && typeof body === "object" && "date" in body && typeof (body as { date: unknown }).date === "string"
      ? (body as { date: string }).date
      : "";
  const taken = new Set(isDateString(date) ? await takenSlotStarts(date) : []);
  const parsed = parseBooking(body, taken);
  if (!parsed.ok) {
    if (parsed.errors.time === "taken") {
      return NextResponse.json({ error: "conflict" }, { status: 409 });
    }
    return NextResponse.json({ error: "invalid", fields: parsed.errors }, { status: 400 });
  }
  try {
    const booking = await createBooking({
      ...parsed.data,
      slotStarts: parsed.slotStarts,
    });
    await notifyNewBooking(booking);
    return NextResponse.json({ ok: true, id: booking.id });
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: "conflict" }, { status: 409 });
    }
    throw err;
  }
}
