"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Field, PasswordInput, Rules, SubmitButton } from "@/components/auth/AuthFields";
import { api, ApiError } from "@/lib/api";
import { authErrorKey } from "@/lib/authErrors";
import { isValidPassword, passwordRules } from "@/lib/authRules";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";

// The page behind the one-time link that is e-mailed to a customer who forgot their password (or sent by OSTA).
function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: TranslationKey; confirm?: TranslationKey }>({});
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [badLink, setBadLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const rules = passwordRules(password);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    const next: typeof errors = {};
    if (!isValidPassword(password)) next.password = "auth.errPasswordRule";
    if (confirm !== password) next.confirm = "auth.errMismatch";
    setErrors(next);
    if (next.password || next.confirm) return;
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_token") setBadLink(true);
      else setFormError(authErrorKey(err));
    } finally {
      setBusy(false);
    }
  }

  if (!token || badLink) {
    return (
      <div className="auth-glass flex flex-col items-center gap-4 p-7 text-center">
        <Alert>{badLink ? t("auth.resetBadLink") : t("auth.resetNoToken")}</Alert>
        <Link href="/forgot-password" className="auth-btn text-base">{t("auth.requestNewLink")}</Link>
        <Link href="/login" className="auth-link text-sm">{t("auth.backToLogin")}</Link>
      </div>
    );
  }
  if (done) {
    return (
      <div className="auth-glass flex flex-col items-center gap-4 p-7 text-center" role="status">
        <span className="auth-icon !h-14 !w-14"><CheckCircle2 size={28} aria-hidden /></span>
        <h1 className="text-2xl font-extrabold">{t("auth.resetDoneTitle")}</h1>
        <p className="text-sm text-[#b9c9e4]">{t("auth.resetDoneText")}</p>
        <Link href="/login" className="auth-btn text-base">{t("auth.login")}</Link>
      </div>
    );
  }
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("auth.resetTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#91a5c7]">{t("auth.resetSub")}</p>
      </div>
      <form onSubmit={submit} noValidate className="auth-glass flex flex-col gap-4 p-5 sm:p-7">
        <Field label={t("auth.newPassword")} htmlFor="rp-password" error={errors.password ? t(errors.password) : null}>
          <PasswordInput id="rp-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} show={show} onToggle={() => setShow((v) => !v)} invalid={!!errors.password} />
        </Field>
        <Field label={t("auth.confirmPassword")} htmlFor="rp-confirm" error={errors.confirm ? t(errors.confirm) : null}>
          <PasswordInput id="rp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} show={show} onToggle={() => setShow((v) => !v)} invalid={!!errors.confirm} />
        </Field>
        <Rules items={[{ ok: rules.length, label: t("auth.ruleLength") }, { ok: rules.capital, label: t("auth.ruleCapital") }, { ok: rules.number, label: t("auth.ruleNumber") }, { ok: confirm.length > 0 && confirm === password, label: t("auth.ruleMatch") }]} />
        {formError && <Alert>{t(formError)}</Alert>}
        <SubmitButton busy={busy} label={t("auth.resetSubmit")} busyLabel={t("auth.resetSaving")} />
        <Link href="/login" className="auth-link text-center text-sm">{t("auth.backToLogin")}</Link>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
