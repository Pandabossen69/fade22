import { site } from "@/lib/site";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="border-b border-line bg-bg2">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <p className="kicker">{site.nameEn}</p>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="focus-ring text-muted hover:text-gold2" aria-label={site.nameEn}>
              ×
            </button>
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
    </div>
  );
}
