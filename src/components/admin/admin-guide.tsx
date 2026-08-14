"use client";

import { useLang } from "../language-context";

export function AdminGuide() {
  const { t } = useLang();
  return (
    <div className="mb-8 border border-line bg-bg2 px-4 py-5">
      <p className="text-base leading-relaxed text-ink">{t("adminHow")}</p>
    </div>
  );
}
