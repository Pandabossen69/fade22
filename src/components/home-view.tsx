"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "./language-context";
import { site } from "@/lib/site";
import { services } from "@/lib/services";

export function HomeView() {
  const { t, lang } = useLang();
  const brand = lang === "en" ? site.nameEn : site.nameTh;

  return (
    <div>
      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/gallery/hero-mobile.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover md:hidden"
        />
        <Image
          src="/gallery/hero-1.jpg"
          alt=""
          fill
          sizes="100vw"
          className="hidden object-cover md:block"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-end px-4 pb-28 pt-24 md:pb-16">
          <p className="kicker mb-4">{t("hours")}</p>
          <h1 className={lang === "en" ? "wordmark text-[16vw] leading-[0.85] text-ink sm:text-8xl md:text-9xl" : "text-[18vw] font-medium leading-[0.9] tracking-tight text-ink sm:text-8xl md:text-9xl"}>
            {brand}
          </h1>
          <div className="hairline my-6 max-w-md" />
          <p className="max-w-sm text-xl leading-snug text-gold2 sm:text-2xl">{t("hero")}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{t("sub")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book"
              className="focus-ring flex h-12 items-center justify-center bg-gold px-8 text-[13px] tracking-[0.22em] uppercase text-black"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/gallery"
              className="focus-ring flex h-12 items-center justify-center border border-gold px-8 text-[13px] tracking-[0.22em] uppercase text-gold2"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
          <p className="mt-8 text-[11px] tracking-[0.18em] uppercase text-dim">{t("hours")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <p className="kicker mb-6">{t("ctaTertiary")}</p>
        <ul className="divide-y divide-line border-y border-line">
          {services.map((s) => (
            <li key={s.id}>
              <Link
                href={`/book?service=${s.id}`}
                className="focus-ring flex items-baseline justify-between gap-4 py-4"
              >
                <span className="text-base">
                  {lang === "en" ? s.nameEn : s.nameTh}
                </span>
                <span className="text-sm tabular-nums text-gold">฿{s.priceThb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
