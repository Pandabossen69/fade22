import Link from "next/link";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4">
      <p className="wordmark text-ink">{site.nameEn}</p>
      <Link href="/" className="focus-ring text-sm tracking-[0.2em] uppercase text-muted hover:text-gold2">
        {site.lineTh}
      </Link>
    </div>
  );
}
