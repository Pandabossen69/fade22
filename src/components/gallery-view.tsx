"use client";

import Image from "next/image";
import { useLang } from "./language-context";

const FALLBACK = Array.from(
  { length: 12 },
  (_, i) => `/gallery/gallery-${String(i + 1).padStart(2, "0")}.jpg`,
);

export function GalleryView({ images }: { images: string[] }) {
  const { t } = useLang();
  const tiles = images.length > 0 ? images : FALLBACK;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="kicker mb-2">{t("navGallery")}</p>
      <div className="hairline mb-8 max-w-xs" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {tiles.map((src) => (
          <div key={src} className="relative aspect-[3/4] overflow-hidden bg-elev">
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
