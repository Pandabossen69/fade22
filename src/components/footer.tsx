"use client";

import Link from "next/link";
import { useLang } from "./language-context";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-line px-4 pb-24 pt-10 md:pb-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm text-muted">
        <p className="kicker">{t("hours")}</p>
        <Link href="/book#pdpa" className="focus-ring w-fit text-[11px] tracking-[0.16em] uppercase text-dim hover:text-gold">
          PDPA
        </Link>
      </div>
    </footer>
  );
}
