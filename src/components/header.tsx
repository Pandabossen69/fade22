"use client";

import Link from "next/link";
import { useLang } from "./language-context";
import { LanguageSwitch } from "./language-switch";
import { site } from "@/lib/site";

export function Header() {
  const { t } = useLang();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(5,5,5,0.88)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link href="/" className="focus-ring wordmark shrink-0 text-[13px] text-gold2">
          {site.nameEn}
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-[11px] tracking-[0.12em] uppercase text-muted sm:gap-4 sm:tracking-[0.18em]">
          <Link href="/" className="focus-ring hover:text-ink">
            {t("navHome")}
          </Link>
          <Link href="/gallery" className="focus-ring hover:text-ink">
            {t("navGallery")}
          </Link>
          <Link href="/book" className="focus-ring hidden text-gold sm:inline hover:text-gold2">
            {t("navBook")}
          </Link>
        </nav>
        <LanguageSwitch />
      </div>
    </header>
  );
}
