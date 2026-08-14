import { NextRequest, NextResponse } from "next/server";
import { passwordOk, setSessionCookie } from "@/lib/auth";
import { clientKey, rateLimitOk } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  if (!rateLimitOk(`login:${clientKey(req.headers)}`)) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const password = sanitizeText(body.password, 200);
  if (!(await passwordOk(password))) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
