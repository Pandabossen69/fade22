"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "./language-context";

export function StickyCta() {
  const { t } = useLang();
  const path = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (path === "/book" || path.startsWith("/admin")) {
      setVisible(false);
      return;
    }

    if (path !== "/") {
      setVisible(true);
      return;
    }

    setVisible(false);
    let io: IntersectionObserver | null = null;
    let cancelled = false;
    let tries = 0;

    function attach() {
      if (cancelled) return;
      const el = document.querySelector("[data-hero-cta]");
      if (!el) {
        if (tries++ < 30) requestAnimationFrame(attach);
        else setVisible(true);
        return;
      }
      io = new IntersectionObserver(
        ([entry]) => {
          setVisible(!entry.isIntersecting);
        },
        { threshold: 0 },
      );
      io.observe(el);
    }

    attach();
    return () => {
      cancelled = true;
      io?.disconnect();
    };
  }, [path]);

  if (path === "/book" || path.startsWith("/admin")) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <Link
        href="/book"
        tabIndex={visible ? 0 : -1}
        className="focus-ring flex h-12 items-center justify-center bg-gold text-[13px] tracking-[0.22em] uppercase text-black"
      >
        {t("ctaPrimary")}
      </Link>
    </div>
  );
}
