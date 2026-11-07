"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Checkbox, Field, PasswordInput, PhoneInput, Rules, SubmitButton, TextInput } from "@/components/auth/AuthFields";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { authErrorKey } from "@/lib/authErrors";
import { isEmail, isValidPassword, mobileDigits, passwordRules } from "@/lib/authRules";
import { hasDraft } from "@/lib/bookingDraft";
import { useLanguage } from "@/lib/language-context";
import { useSite } from "@/lib/site-context";
import type { TranslationKey } from "@/lib/i18n";

const EMIRATES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Al Ain", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

type Errors = Partial<Record<"name" | "mobile" | "email" | "password" | "confirm" | "terms" | "privacy", TranslationKey>>;

export default function SignupPage() {
  const router = useRouter();
  const { token, loading, login } = useAuth();
  const { t } = useLanguage();
  const { integrations } = useSite();

  const [name, setName] = useState("");
  const [dial, setDial] = useState("971");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [emirate, setEmirate] = useState(EMIRATES[1]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && token) router.replace(hasDraft() ? "/orders/new" : "/dashboard");
  }, [loading, token, router]);

  const rules = passwordRules(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);

    const next: Errors = {};
    const m = mobileDigits(dial, mobile);
    if (!name.trim()) next.name = "auth.errName";
    if (!mobile.trim()) next.mobile = "auth.errMobileRequired";
    else if (!m.ok) next.mobile = "auth.errMobileInvalid";
    if (!email.trim()) next.email = "auth.errEmailRequired";
    else if (!isEmail(email)) next.email = "auth.errEmailInvalid";
    if (!isValidPassword(password)) next.password = "auth.errPasswordRule";
    if (confirm !== password) next.confirm = "auth.errMismatch";
    if (!terms) next.terms = "auth.errTerms";
    if (!privacy) next.privacy = "auth.errPrivacy";
    setErrors(next);
    if (Object.keys(next).length > 0 || !m.ok) return;

    setBusy(true);
    try {
      const res = await api.signup({ name: name.trim(), phone: m.digits, email: email.trim(), password, emirate });
      login(res.accessToken, res.customer, true);
      router.replace(hasDraft() ? "/orders/new" : "/dashboard");
    } catch (err) {
      setFormError(authErrorKey(err));
      setBusy(false);
    }
  }

  const err = (k: keyof Errors) => (errors[k] ? t(errors[k]!) : null);

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("auth.signupTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#91a5c7]">{t("auth.signupSub")}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-glass flex flex-col gap-4 p-5 sm:p-7">
        <Field label={t("auth.fullName")} htmlFor="su-name" error={err("name")}>
          <TextInput id="su-name" icon="user" autoComplete="name" placeholder={t("auth.fullNamePh")} value={name} onChange={(e) => setName(e.target.value)} invalid={!!errors.name} />
        </Field>

        <Field label={t("auth.mobile")} htmlFor="su-mobile" error={err("mobile")}>
          <PhoneInput id="su-mobile" autoComplete="tel-national" placeholder={t("auth.mobilePh")} value={mobile} onChange={(e) => setMobile(e.target.value)} dial={dial} onDial={setDial} invalid={!!errors.mobile} />
        </Field>

        <Field label={t("auth.email")} htmlFor="su-email" error={err("email")}>
          <TextInput id="su-email" icon="mail" ltr type="email" autoComplete="email" inputMode="email" placeholder={t("auth.emailPh")} value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} />
        </Field>

        <Field label={t("auth.emirate")} htmlFor="su-emirate">
          <div className="auth-field">
            <select id="su-emirate" value={emirate} onChange={(e) => setEmirate(e.target.value)} className="cursor-pointer">
              {EMIRATES.map((e) => (<option key={e} value={e}>{t(`signup.emirates.${e}` as TranslationKey)}</option>))}
            </select>
          </div>
        </Field>

        <Field label={t("auth.password")} htmlFor="su-password" error={err("password")}>
          <PasswordInput id="su-password" autoComplete="new-password" placeholder={t("auth.passwordPh")} value={password} onChange={(e) => setPassword(e.target.value)} show={show} onToggle={() => setShow((v) => !v)} invalid={!!errors.password} />
        </Field>
        <Rules items={[{ ok: rules.length, label: t("auth.ruleLength") }, { ok: rules.capital, label: t("auth.ruleCapital") }, { ok: rules.number, label: t("auth.ruleNumber") }]} />

        <Field label={t("auth.confirmPassword")} htmlFor="su-confirm" error={err("confirm")}>
          <PasswordInput id="su-confirm" autoComplete="new-password" placeholder={t("auth.passwordPh")} value={confirm} onChange={(e) => setConfirm(e.target.value)} show={show} onToggle={() => setShow((v) => !v)} invalid={!!errors.confirm} />
        </Field>

        <div className="flex flex-col gap-2.5">
          <Checkbox id="su-terms" checked={terms} onChange={setTerms} invalid={!!errors.terms}>
            {t("auth.acceptTermsPre")} <Link href="/terms-conditions" target="_blank" className="auth-link">{t("auth.terms")}</Link>
          </Checkbox>
          {errors.terms && <p role="alert" className="text-xs text-rose-300">{t(errors.terms)}</p>}
          <Checkbox id="su-privacy" checked={privacy} onChange={setPrivacy} invalid={!!errors.privacy}>
            {t("auth.acceptPrivacyPre")} {integrations?.privacyUrl ? <Link href={integrations.privacyUrl} target="_blank" className="auth-link">{t("auth.privacy")}</Link> : t("auth.privacy")}
          </Checkbox>
          {errors.privacy && <p role="alert" className="text-xs text-rose-300">{t(errors.privacy)}</p>}
        </div>

        {formError && <Alert>{t(formError)}</Alert>}

        <SubmitButton busy={busy} label={t("auth.createSubmit")} busyLabel={t("auth.creating")} />

        <p className="text-center text-sm text-[#91a5c7]">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="auth-link">{t("auth.login")}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
