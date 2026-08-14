"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../language-context";

export function LoginForm() {
  const router = useRouter();
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border border-line bg-bg2 p-5">
      <div>
        <label htmlFor="password" className="mb-1 block text-[11px] tracking-[0.14em] uppercase text-muted">
          {t("labelPassword")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={t("labelPassword")}
          className="focus-ring w-full border border-line bg-bg px-3 py-2.5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error ? <p className="h-px bg-danger" /> : null}
      <button
        type="submit"
        disabled={busy}
        className="focus-ring w-full bg-gold px-4 py-3 text-[13px] tracking-[0.18em] uppercase text-black disabled:opacity-40"
      >
        {t("adminLogin")}
      </button>
    </form>
  );
}
