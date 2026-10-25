"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { api, ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

// The page behind the one-time link OSTA sends to a customer who forgot their password.
function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError(t("reset.mismatch"));
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.genericError"));
    } finally {
      setBusy(false);
    }
  }

  if (!token) return <p className="text-sm text-text-muted">{t("reset.noToken")}</p>;
  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-base font-semibold text-text">{t("reset.done")}</p>
        <Link href="/login" className="osta-btn-primary rounded-xl px-6 py-3 text-sm font-semibold text-white">{t("login.submit")}</Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-muted">{t("reset.newPassword")}</span>
        <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="osta-input rounded-xl px-3 py-3 text-sm" dir="ltr" />
        <span className="text-[11px] text-text-faint">{t("login.passwordHint")}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-muted">{t("reset.confirm")}</span>
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="osta-input rounded-xl px-3 py-3 text-sm" dir="ltr" />
      </label>
      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">{error}</p>}
      <button type="submit" disabled={busy || !password || !confirm} className="osta-btn-primary rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? t("reset.saving") : t("reset.submit")}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-10">
      <Logo size="lg" />
      <div>
        <h1 className="text-2xl font-bold text-text">{t("reset.title")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("reset.subtitle")}</p>
      </div>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
