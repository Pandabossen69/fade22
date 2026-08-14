import { NextRequest, NextResponse } from "next/server";
import { createReview, deleteReview, listStoredReviews } from "@/lib/db";
import { sanitizeMultiline, sanitizeText } from "@/lib/sanitize";
import type { Review } from "@/lib/reviews";

export const dynamic = "force-dynamic";

function asStars(n: unknown): Review["stars"] | null {
  const v = Number(n);
  if (v === 1 || v === 2 || v === 3 || v === 4 || v === 5) return v;
  return null;
}

export async function GET() {
  const reviews = await listStoredReviews();
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const name = sanitizeText(b.name, 80);
  const quoteTh = sanitizeMultiline(b.quoteTh, 400);
  const quoteEn = sanitizeMultiline(b.quoteEn, 400);
  const stars = asStars(b.stars);
  if (name.length < 2 || !stars) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!quoteTh && !quoteEn) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const review = await createReview({
    name,
    quoteTh: quoteTh || quoteEn,
    quoteEn: quoteEn || quoteTh,
    stars,
  });
  return NextResponse.json({ ok: true, review });
}

export async function DELETE(req: NextRequest) {
  const id = sanitizeText(req.nextUrl.searchParams.get("id") ?? "", 80);
  if (!id) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ok = await deleteReview(id);
  if (!ok) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
