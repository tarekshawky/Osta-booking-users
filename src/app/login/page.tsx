"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Checkbox, Field, PasswordInput, PhoneInput, SubmitButton, TextInput } from "@/components/auth/AuthFields";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { authErrorKey } from "@/lib/authErrors";
import { isEmail, mobileDigits } from "@/lib/authRules";
import { hasDraft } from "@/lib/bookingDraft";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";

type Method = "email" | "mobile";

export default function LoginPage() {
  const router = useRouter();
  const { token, loading, login } = useAuth();
  const { t } = useLanguage();

  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState("971");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ identifier?: TranslationKey; password?: TranslationKey }>({});
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && token) router.replace(hasDraft() ? "/orders/new" : "/dashboard");
  }, [loading, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return; // one request at a time
    setFormError(null);

    const next: typeof errors = {};
    let identifier = "";
    if (method === "email") {
      if (!email.trim()) next.identifier = "auth.errEmailRequired";
      else if (!isEmail(email)) next.identifier = "auth.errEmailInvalid";
      else identifier = email.trim();
    } else {
      if (!mobile.trim()) next.identifier = "auth.errMobileRequired";
      else {
        const m = mobileDigits(dial, mobile);
        if (!m.ok) next.identifier = "auth.errMobileInvalid";
        else identifier = m.full;
      }
    }
    if (!password) next.password = "auth.errPasswordRequired";
    setErrors(next);
    if (next.identifier || next.password) return;

    setBusy(true);
    try {
      const res = await api.login(identifier, password);
      login(res.accessToken, res.customer, remember);
      router.replace(hasDraft() ? "/orders/new" : "/dashboard");
    } catch (err) {
      setFormError(authErrorKey(err));
      setBusy(false);
    }
  }

  const tab = (m: Method, label: TranslationKey) => (
    <button
      type="button"
      role="tab"
      aria-selected={method === m}
      onClick={() => { setMethod(m); setErrors({}); setFormError(null); }}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${method === m ? "bg-[#087bff] text-white shadow-[0_0_18px_rgba(8,123,255,0.5)]" : "text-[#91a5c7] hover:text-white"}`}
    >
      {t(label)}
    </button>
  );

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("auth.welcome")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#91a5c7]">{t("auth.welcomeSub")}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-glass flex flex-col gap-5 p-5 sm:p-7">
        <div role="tablist" aria-label={t("auth.loginMethod")} className="flex gap-1 rounded-xl bg-[rgba(6,19,43,0.8)] p-1">
          {tab("email", "auth.tabEmail")}
          {tab("mobile", "auth.tabMobile")}
        </div>

        {method === "email" ? (
          <Field label={t("auth.email")} htmlFor="login-email" error={errors.identifier ? t(errors.identifier) : null}>
            <TextInput id="login-email" icon="mail" ltr type="email" autoComplete="username" inputMode="email" placeholder={t("auth.emailPh")} value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.identifier} />
          </Field>
        ) : (
          <Field label={t("auth.mobile")} htmlFor="login-mobile" error={errors.identifier ? t(errors.identifier) : null}>
            <PhoneInput id="login-mobile" autoComplete="tel-national" placeholder={t("auth.mobilePh")} value={mobile} onChange={(e) => setMobile(e.target.value)} dial={dial} onDial={setDial} invalid={!!errors.identifier} />
          </Field>
        )}

        <Field label={t("auth.password")} htmlFor="login-password" error={errors.password ? t(errors.password) : null}>
          <PasswordInput id="login-password" autoComplete="current-password" placeholder={t("auth.passwordPh")} value={password} onChange={(e) => setPassword(e.target.value)} show={show} onToggle={() => setShow((v) => !v)} invalid={!!errors.password} />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox id="login-remember" checked={remember} onChange={setRemember}>{t("auth.remember")}</Checkbox>
          <Link href="/forgot-password" className="auth-link text-sm">{t("auth.forgot")}</Link>
        </div>

        {formError && <Alert>{t(formError)}</Alert>}

        <SubmitButton busy={busy} label={t("auth.login")} busyLabel={t("auth.loggingIn")} />

        <p className="text-center text-sm text-[#91a5c7]">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="auth-link">{t("auth.createAccount")}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
