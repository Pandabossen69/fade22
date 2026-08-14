"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./language-context";

export function StickyCta() {
  const { t } = useLang();
  const path = usePathname();
  if (path === "/book" || path.startsWith("/admin")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[rgba(5,5,5,0.94)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        href="/book"
        className="focus-ring flex h-12 items-center justify-center bg-gold text-[13px] tracking-[0.22em] uppercase text-black"
      >
        {t("ctaPrimary")}
      </Link>
    </div>
  );
}
