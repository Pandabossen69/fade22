export function NotifySetup({ topic }: { topic: string }) {
  const href = `https://ntfy.sh/${encodeURIComponent(topic)}`;

  return (
    <div className="mb-10 border border-line bg-bg2 px-4 py-5">
      <p className="text-base text-ink">เปิดแจ้งเตือนบนมือถือ</p>
      <p className="mt-1 text-sm text-muted">Get booking alerts</p>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-4 inline-flex h-11 items-center justify-center bg-gold px-5 text-[12px] tracking-[0.18em] uppercase text-black"
      >
        ntfy
      </a>
    </div>
  );
}
