import { promises as fs } from "fs";
import path from "path";
import { GalleryView } from "@/components/gallery-view";

async function listGallery(): Promise<string[]> {
  const dir = path.join(process.cwd(), "public/gallery");
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f) && !f.startsWith("hero"))
      .sort()
      .map((f) => `/gallery/${f}`);
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const images = await listGallery();
  return <GalleryView images={images} />;
}
