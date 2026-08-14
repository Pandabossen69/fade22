import { NextResponse } from "next/server";
import { listStoredReviews } from "@/lib/db";
import { fetchGoogleReviews } from "@/lib/google-reviews";
import { googleReviewsConfig, reviews as seed } from "@/lib/reviews";
import type { Review } from "@/lib/reviews";

export const dynamic = "force-dynamic";

function merge(parts: Review[][]): Review[] {
  const seen = new Set<string>();
  const out: Review[] = [];
  for (const list of parts) {
    for (const r of list) {
      if (!r?.id || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}

export async function GET() {
  let google: Awaited<ReturnType<typeof fetchGoogleReviews>> = null;
  try {
    google = await fetchGoogleReviews();
  } catch {
    google = null;
  }

  let stored: Review[] = [];
  try {
    stored = await listStoredReviews();
  } catch {
    stored = [];
  }

  return NextResponse.json({
    reviews: merge([google?.reviews ?? [], stored, seed]),
    googleEnabled: googleReviewsConfig.enabled,
    rating: google?.rating,
    userRatingsTotal: google?.userRatingsTotal,
  });
}
