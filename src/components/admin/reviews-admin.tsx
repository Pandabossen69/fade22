"use client";

import { useState } from "react";
import { useLang } from "../language-context";
import type { Review } from "@/lib/reviews";

export function ReviewsAdmin({ reviews: initial }: { reviews: Review[] }) {
  const { t, lang } = useLang();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [stars, setStars] = useState<Review["stars"]>(5);
  const [quoteTh, setQuoteTh] = useState("");
  const [quoteEn, setQuoteEn] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, stars, quoteTh, quoteEn }),
      });
      if (!res.ok) return;
      const j = (await res.json()) as { review?: Review };
      if (j.review) {
        setItems((prev) => [j.review!, ...prev]);
        setName("");
        setQuoteTh("");
        setQuoteEn("");
        setStars(5);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mt-12">
      <p className="kicker mb-4">{t("reviewsTitle")}</p>
      <form onSubmit={add} className="mb-6 space-y-3 border border-line bg-bg2 px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="rev-name" className="mb-1 block text-[11px] tracking-[0.14em] uppercase text-muted">
              {t("labelName")}
            </label>
            <input
              id="rev-name"
              required
              className="focus-ring w-full border border-line bg-bg px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rev-stars" className="mb-1 block text-[11px] tracking-[0.14em] uppercase text-muted">
              {t("labelStars")}
            </label>
            <select
              id="rev-stars"
              className="focus-ring w-full border border-line bg-bg px-3 py-2"
              value={stars}
              onChange={(e) => setStars(Number(e.target.value) as Review["stars"])}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="rev-th" className="mb-1 block text-[11px] tracking-[0.14em] uppercase text-muted">
            {t("labelQuoteTh")}
          </label>
          <textarea
            id="rev-th"
            rows={2}
            className="focus-ring w-full border border-line bg-bg px-3 py-2"
            value={quoteTh}
            onChange={(e) => setQuoteTh(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="rev-en" className="mb-1 block text-[11px] tracking-[0.14em] uppercase text-muted">
            {t("labelQuoteEn")}
          </label>
          <textarea
            id="rev-en"
            rows={2}
            className="focus-ring w-full border border-line bg-bg px-3 py-2"
            value={quoteEn}
            onChange={(e) => setQuoteEn(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="focus-ring flex h-11 items-center justify-center bg-gold px-5 text-[12px] tracking-[0.18em] uppercase text-black disabled:opacity-40"
        >
          {t("reviewsAdd")}
        </button>
      </form>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3 border border-line bg-bg2 px-4 py-3">
            <div className="min-w-0">
              <p className="text-gold2">{"★".repeat(r.stars)}</p>
              <p className="mt-1 text-sm text-ink">{lang === "en" ? r.quoteEn || r.quoteTh : r.quoteTh || r.quoteEn}</p>
              <p className="mt-1 text-[12px] text-dim">{r.name}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(r.id)}
              className="focus-ring shrink-0 px-2 py-1 text-[11px] tracking-[0.14em] uppercase text-muted hover:text-danger"
            >
              {t("reviewsDelete")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
