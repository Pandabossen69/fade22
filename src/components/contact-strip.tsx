"use client";

import { useLang } from "./language-context";
import { site } from "@/lib/site";

export function ContactLinks({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useLang();
  const address = lang === "en" ? site.addressEn : site.addressTh;
  const row = compact
    ? "focus-ring flex min-h-11 items-baseline justify-between gap-4 py-1.5"
    : "focus-ring flex min-h-14 items-center justify-between gap-4 border-b border-line py-4 last:border-b-0";

  return (
    <ul className={compact ? "space-y-1" : ""}>
      <li>
        <a href={`tel:${site.phoneTel}`} className={row}>
          <span className="kicker">{t("contactPhone")}</span>
          <span className="tabular-nums text-ink">{site.phoneDisplay}</span>
        </a>
      </li>
      <li>
        <a href={`mailto:${site.email}`} className={row}>
          <span className="kicker">{t("contactEmail")}</span>
          <span className="text-ink">{site.email}</span>
        </a>
      </li>
      <li>
        <div className={row}>
          <span className="kicker">{t("contactAddress")}</span>
          <span className="text-right text-muted">{address}</span>
        </div>
      </li>
    </ul>
  );
}

export function MapPlaceholder() {
  const { t, lang } = useLang();
  const address = lang === "en" ? site.addressEn : site.addressTh;
  const inner = (
    <div className="map-panel relative flex aspect-[16/10] flex-col items-center justify-center overflow-hidden border border-line">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-[18%] right-[18%] top-[28%] h-px bg-ink/10" />
        <div className="absolute bottom-[30%] left-[12%] right-[12%] h-px bg-ink/10" />
        <div className="absolute bottom-[22%] top-[22%] left-[32%] w-px bg-ink/10" />
        <div className="absolute bottom-[18%] top-[18%] right-[40%] w-px bg-ink/8" />
      </div>
      <span className="relative mb-3 flex h-10 w-10 items-center justify-center border border-line text-gold2">
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
          <path
            d="M7 0C3.4 0 .5 2.9.5 6.5c0 4.9 6.5 11.5 6.5 11.5S13.5 11.4 13.5 6.5C13.5 2.9 10.6 0 7 0Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="7" cy="6.5" r="2" fill="currentColor" />
        </svg>
      </span>
      <p className="relative kicker mb-2">{t("contactAddress")}</p>
      <p className="relative text-sm text-muted">{address}</p>
    </div>
  );

  if (site.mapsUrl) {
    return (
      <a href={site.mapsUrl} target="_blank" rel="noreferrer" className="focus-ring block">
        {inner}
      </a>
    );
  }
  return inner;
}

export function ContactStrip() {
  return (
    <section className="relative mx-auto max-w-5xl px-4 py-16">
      <div className="border border-line bg-white/80 px-4 py-2 backdrop-blur-sm sm:px-6">
        <ContactLinks />
      </div>
      <div className="mt-6">
        <MapPlaceholder />
      </div>
    </section>
  );
}
