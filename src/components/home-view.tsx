"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "./language-context";
import { ContactStrip } from "./contact-strip";
import { ReviewsStrip } from "./reviews-strip";
import { Reveal } from "./reveal";
import { services } from "@/lib/services";

export function HomeView() {
  const { t, lang } = useLang();

  return (
    <div>
      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/gallery/real-01.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="hero-copy relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-24 pt-24 md:px-8 md:pb-28">
          <h1 className="wordmark text-[11vw] leading-[0.92] text-[#f7f1e8] sm:text-6xl md:text-7xl">
            A DAY <span className="text-gold">CUTZ</span>
          </h1>
          <p className="mt-4 text-[17px] leading-snug text-[#f7f1e8] sm:text-xl md:text-2xl">{t("hero")}</p>
          <p className="mt-1.5 text-sm text-[#f7f1e8]/80 sm:text-base">{t("sub")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
            <Link
              href="/book"
              data-hero-cta
              className="focus-ring flex h-14 items-center justify-center bg-gold px-10 text-[14px] tracking-[0.22em] uppercase text-black"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/gallery"
              className="hero-cta-ghost focus-ring flex h-14 items-center justify-center px-10 text-[14px] tracking-[0.22em] uppercase text-[#f7f1e8] backdrop-blur-sm"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-24">
        <Reveal>
          <p className="kicker mb-8">{t("ctaTertiary")}</p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {services.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={`/book?service=${s.id}`}
                  className="focus-ring group flex items-center justify-between gap-4 border border-line bg-bg2/90 px-5 py-5 shadow-sm transition-colors hover:border-gold"
                >
                  <span className="flex min-w-0 items-baseline gap-4">
                    <span className="hidden w-6 shrink-0 font-mono text-[11px] tabular-nums text-dim sm:inline">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block text-lg leading-tight text-ink">
                        {lang === "en" ? s.nameEn : s.nameTh}
                      </span>
                      <span className="mt-1 block text-[12px] text-dim">
                        {s.durationMin} {t("minutes")}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-lg tabular-nums text-gold2">฿{s.priceThb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <Reveal>
        <ReviewsStrip />
      </Reveal>

      <Reveal>
        <ContactStrip />
      </Reveal>
    </div>
  );
}
