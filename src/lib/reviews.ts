export type Review = {
  id: string;
  name: string;
  quoteTh: string;
  quoteEn: string;
  stars: 1 | 2 | 3 | 4 | 5;
  source?: "google" | "shop";
};

/** Seed list — real quotes only. Empty until the shop adds them in /admin. */
export const reviews: Review[] = [];

export const googleReviewsConfig = {
  placeId: "ChIJ0avgISqq_TA51LhIFNDWqOY",
  enabled: Boolean(process.env.GOOGLE_PLACES_API_KEY),
};
