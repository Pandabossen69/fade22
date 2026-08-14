"use client";

import { useEffect, useState } from "react";
import { useLang } from "./language-context";
import type { Review } from "@/lib/reviews";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5 text-[15px]" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "text-gold" : "text-dim/40"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewsStrip() {
  const { t, lang } = useLang();
  const [items, setItems] = useState<Review[]>([]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((j: { reviews?: Review[] }) => {
        if (!ignore && Array.isArray(j.reviews)) setItems(j.reviews);
      })
      .catch(() => {
        /* keep seed — never break the homepage */
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
      <p className="kicker mb-8">{t("reviewsTitle")}</p>
      {items.length === 0 ? (
        <div className="border border-line bg-bg2/80 px-6 py-12 text-center md:px-12 md:py-16">
          <p className="text-lg leading-snug text-gold2" aria-hidden="true">
            ★★★★★
          </p>
          <p className="mt-4 text-lg text-ink">{t("reviewsSoon")}</p>
          <p className="mt-3 text-[11px] tracking-[0.16em] uppercase text-dim">{t("reviewsFromGoogle")}</p>
        </div>
      ) : (
        <ul className="reviews-rail -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
          {items.map((r) => {
            const quote = lang === "en" ? r.quoteEn || r.quoteTh : r.quoteTh || r.quoteEn;
            return (
              <li
                key={r.id}
                className="w-[min(18.5rem,82vw)] shrink-0 snap-start border border-line bg-bg2/90 px-5 py-5 shadow-sm md:w-auto"
              >
                <Stars n={r.stars} />
                <p className="mt-3 text-[15px] leading-relaxed text-ink">{quote}</p>
                <p className="mt-4 text-sm text-muted">{r.name}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
