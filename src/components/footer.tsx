"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./language-context";
import { ContactLinks } from "./contact-strip";
import { site } from "@/lib/site";

export function Footer() {
  const { t } = useLang();
  const path = usePathname();
  const stickyPad = path === "/book" || path.startsWith("/admin") ? "pb-10" : "pb-24 md:pb-10";

  return (
    <footer className={`relative z-10 border-t border-line bg-bg/80 px-4 pt-12 backdrop-blur-md md:px-8 ${stickyPad}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="wordmark flex items-center gap-2 text-sm text-ink md:text-base">
            <span className="pole" aria-hidden="true" />
            {site.nameEn}
          </p>
          <p className="mt-3 kicker">{t("hours")}</p>
        </div>
        <div className="flex flex-col gap-6">
          <ContactLinks compact />
          <Link href="/book#pdpa" className="focus-ring w-fit text-[11px] tracking-[0.16em] uppercase text-dim hover:text-gold2">
            PDPA
          </Link>
        </div>
      </div>
    </footer>
  );
}
