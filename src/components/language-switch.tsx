"use client";

import { useLang } from "./language-context";

function ThaiFlag() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <rect width="18" height="12" fill="#A51931" />
      <rect y="2" width="18" height="8" fill="#F4F5F8" />
      <rect y="4" width="18" height="4" fill="#2D2A4A" />
    </svg>
  );
}

function UkFlag() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <rect width="18" height="12" fill="#012169" />
      <path d="M0 0 L18 12 M18 0 L0 12" stroke="#fff" strokeWidth="2.4" />
      <path d="M0 0 L18 12 M18 0 L0 12" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M9 0 V12 M0 6 H18" stroke="#fff" strokeWidth="4" />
      <path d="M9 0 V12 M0 6 H18" stroke="#C8102E" strokeWidth="2.2" />
    </svg>
  );
}

export function LanguageSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={() => setLang("th")}
        className={`focus-ring flex items-center gap-1 px-1 py-1 text-[11px] tracking-[0.14em] ${
          lang === "th" ? "text-ink" : "text-muted"
        }`}
        aria-pressed={lang === "th"}
        aria-label="TH"
      >
        <ThaiFlag />
        <span>{t("langTh")}</span>
      </button>
      <span className="text-dim">/</span>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`focus-ring flex items-center gap-1 px-1 py-1 text-[11px] tracking-[0.14em] ${
          lang === "en" ? "text-ink" : "text-muted"
        }`}
        aria-pressed={lang === "en"}
        aria-label="EN"
      >
        <UkFlag />
        <span>{t("langEn")}</span>
      </button>
    </div>
  );
}
