"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "./language-context";
import { ContactStrip } from "./contact-strip";
import { Reveal } from "./reveal";
import { site } from "@/lib/site";
import { services } from "@/lib/services";

export function HomeView() {
  const { t, lang } = useLang();

  return (
    <div>
      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/gallery/hero-shop.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_42%] md:hidden"
        />
        <Image
          src="/gallery/hero-interior.jpg"
          alt=""
          fill
          sizes="100vw"
          className="hidden object-cover object-[center_20%] md:block"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="hero-copy relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-end px-4 pb-16 pt-24">
          <p className="kicker mb-5">{t("hours")}</p>
          <h1 className="wordmark text-[10.5vw] leading-[0.92] text-ink sm:text-6xl md:text-7xl">
            A DAY <span className="text-gold">CUTZ</span>
          </h1>
          <p className="mt-3 text-base text-muted">
            {lang === "en" ? site.addressEn : site.lineTh}
          </p>
          <p className="mt-5 max-w-sm text-xl leading-snug text-ink sm:text-2xl">{t("hero")}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{t("sub")}</p>
          <div className="mt-9 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <Link
              href="/book"
              data-hero-cta
              className="focus-ring flex h-12 items-center justify-center bg-gold px-10 text-[13px] tracking-[0.22em] uppercase text-black"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/gallery"
              className="focus-ring flex h-12 items-center justify-center px-2 text-[12px] tracking-[0.2em] uppercase text-muted hover:text-ink"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 py-20">
        <Reveal>
          <p className="kicker mb-8">{t("ctaTertiary")}</p>
          <ul className="grid gap-3">
            {services.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={`/book?service=${s.id}`}
                  className="focus-ring group flex items-center justify-between gap-4 border border-line bg-bg2/90 px-5 py-5 shadow-sm transition-colors hover:border-gold/70"
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
        <ContactStrip />
      </Reveal>
    </div>
  );
}
