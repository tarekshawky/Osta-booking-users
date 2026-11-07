"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Field, SubmitButton, TextInput } from "@/components/auth/AuthFields";
import { api } from "@/lib/api";
import { authErrorKey } from "@/lib/authErrors";
import { classifyContact } from "@/lib/authRules";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";

// Step 1 of recovering a password: the customer gives the email or mobile number of the account and we e-mail a one-hour link.
// The answer is the same whether or not an account exists (so the page cannot be used to find out who is registered).
export default function ForgotPasswordPage() {
  const { t, lang } = useLanguage();
  const [value, setValue] = useState("");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const Back = lang === "ar" ? ArrowRight : ArrowLeft;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    const contact = classifyContact(value);
    if (!contact) {
      setError("auth.errIdentifier");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.forgotPassword(contact);
      setSent(true);
    } catch (err) {
      setFormError(authErrorKey(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="auth-glass flex flex-col items-center gap-4 p-7 text-center" role="status">
          <span className="auth-icon !h-14 !w-14"><MailCheck size={28} aria-hidden /></span>
          <h1 className="text-2xl font-extrabold">{t("auth.sentTitle")}</h1>
          <p className="text-sm leading-relaxed text-[#b9c9e4]">{t("auth.sentText")}</p>
          <p className="text-xs leading-relaxed text-[#7f93b8]">{t("auth.sentNote")}</p>
          <div className="mt-2 flex w-full flex-col gap-3">
            <Link href="/login" className="auth-btn text-base">{t("auth.backToLogin")}</Link>
            <button type="button" onClick={() => { setSent(false); setValue(""); }} className="auth-link text-sm">{t("auth.requestNewLink")}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">{t("auth.forgotTitle")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#91a5c7]">{t("auth.forgotSub")}</p>
          </div>
          <form onSubmit={submit} noValidate className="auth-glass flex flex-col gap-5 p-5 sm:p-7">
            <Field label={t("auth.forgotLabel")} htmlFor="fp-id" error={error ? t(error) : null}>
              <TextInput id="fp-id" icon="mail" ltr autoComplete="username" placeholder={t("auth.forgotPh")} value={value} onChange={(e) => setValue(e.target.value)} invalid={!!error} />
            </Field>
            {formError && <Alert>{t(formError)}</Alert>}
            <SubmitButton busy={busy} label={t("auth.sendLink")} busyLabel={t("auth.sending")} />
            <Link href="/login" className="auth-link inline-flex items-center justify-center gap-1.5 text-sm"><Back size={15} aria-hidden />{t("auth.backToLogin")}</Link>
          </form>
        </>
      )}
    </AuthShell>
  );
}
