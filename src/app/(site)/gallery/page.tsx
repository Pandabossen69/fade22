import { promises as fs } from "fs";
import path from "path";
import { GalleryView } from "@/components/gallery-view";

const STOCK_KEEP = new Set([
  "gallery-02.jpg",
  "gallery-03.jpg",
  "gallery-05.jpg",
  "gallery-08.jpg",
]);

async function listGallery(): Promise<string[]> {
  const dir = path.join(process.cwd(), "public/gallery");
  try {
    const files = await fs.readdir(dir);
    const real = files.filter((f) => /^real-\d+\.(jpe?g|png|webp|avif)$/i.test(f)).sort();
    const stock = files.filter((f) => STOCK_KEEP.has(f)).sort();
    return [...real, ...stock].map((f) => `/gallery/${f}`);
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const images = await listGallery();
  return <GalleryView images={images} />;
}
