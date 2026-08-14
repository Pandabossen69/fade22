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
        <a href={site.mapsDirections} target="_blank" rel="noreferrer" className={row}>
          <span className="kicker">{t("contactAddress")}</span>
          <span className="text-right text-muted">{address}</span>
        </a>
      </li>
    </ul>
  );
}

export function MapPlaceholder() {
  const { t } = useLang();

  return (
    <a
      href={site.mapsDirections}
      target="_blank"
      rel="noreferrer"
      className="focus-ring map-panel relative block aspect-[16/10] w-full overflow-hidden border border-line"
    >
      <iframe
        src={site.mapsEmbed}
        title={t("contactAddress")}
        loading="lazy"
        className="pointer-events-none h-full w-full border-0"
      />
      <span className="pointer-events-none absolute bottom-3 right-3 bg-gold px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-black">
        {t("contactDirections")}
      </span>
    </a>
  );
}

export function ContactStrip() {
  return (
    <section className="relative mx-auto max-w-5xl px-4 py-16">
      <div className="border border-line bg-bg2/80 px-4 py-2 backdrop-blur-sm sm:px-6">
        <ContactLinks />
      </div>
      <div className="mt-6">
        <MapPlaceholder />
      </div>
    </section>
  );
}
