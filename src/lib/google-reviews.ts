import { googleReviewsConfig, type Review } from "./reviews";

type GoogleReview = {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;
  language?: string;
};

export type GoogleReviewsPayload = {
  reviews: Review[];
  rating?: number;
  userRatingsTotal?: number;
};

function clampStars(n: unknown): Review["stars"] {
  const v = Math.round(Number(n));
  if (v <= 1) return 1;
  if (v === 2) return 2;
  if (v === 3) return 3;
  if (v === 4) return 4;
  return 5;
}

export async function fetchGoogleReviews(): Promise<GoogleReviewsPayload | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !googleReviewsConfig.enabled) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", googleReviewsConfig.placeId);
    url.searchParams.set("fields", "reviews,rating,user_ratings_total");
    url.searchParams.set("key", key);
    url.searchParams.set("reviews_sort", "newest");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      status?: string;
      result?: {
        rating?: number;
        user_ratings_total?: number;
        reviews?: GoogleReview[];
      };
    };
    if (json.status && json.status !== "OK") return null;

    const result = json.result ?? {};
    const raw = Array.isArray(result.reviews) ? result.reviews : [];
    const reviews: Review[] = raw
      .filter((r) => r.author_name && r.text)
      .map((r, i) => {
        const text = String(r.text);
        return {
          id: `google-${r.time ?? i}`,
          name: String(r.author_name),
          quoteTh: text,
          quoteEn: text,
          stars: clampStars(r.rating),
          source: "google" as const,
        };
      });

    return {
      reviews,
      rating: typeof result.rating === "number" ? result.rating : undefined,
      userRatingsTotal: typeof result.user_ratings_total === "number" ? result.user_ratings_total : undefined,
    };
  } catch {
    return null;
  }
}
