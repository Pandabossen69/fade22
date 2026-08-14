"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLang } from "./language-context";

const FALLBACK = [
  "/gallery/real-01.jpg",
  "/gallery/real-02.jpg",
  "/gallery/real-04.jpg",
  "/gallery/real-05.jpg",
  "/gallery/real-06.jpg",
  "/gallery/gallery-02.jpg",
  "/gallery/gallery-03.jpg",
  "/gallery/gallery-05.jpg",
];

export function GalleryView({ images }: { images: string[] }) {
  const { t } = useLang();
  const tiles = images.length > 0 ? images : FALLBACK;
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="kicker mb-8">{t("navGallery")}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {tiles.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(src)}
            className="focus-ring relative aspect-[3/4] overflow-hidden bg-elev"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-white/96 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div className="relative h-[86svh] w-full max-w-lg">
            <Image src={active} alt="" fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
