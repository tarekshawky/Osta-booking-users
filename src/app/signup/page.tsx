"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Phone as PhoneIcon, Eye, EyeOff, ShieldCheck, Clock, Wrench, BadgeCheck } from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";

const FEATURES: { icon: typeof ShieldCheck; key: TranslationKey }[] = [
  { icon: ShieldCheck, key: "login.featureTrusted" },
  { icon: Clock, key: "login.featureSameDay" },
  { icon: BadgeCheck, key: "login.featureWarranty" },
  { icon: Wrench, key: "login.featurePricing" },
];

const EMIRATES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Al Ain", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

function isValidPassword(password: string) {
  return password.length >= 8 && /^[A-Z]/.test(password) && /[0-9]/.test(password);
}

export default function SignupPage() {
  const router = useRouter();
  const { token, loading, login } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emirate, setEmirate] = useState(EMIRATES[1]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && token) router.replace("/dashboard");
  }, [loading, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/[^\d]/g, "").replace(/^0+/, "");
    if (!name.trim()) {
      setError(t("signup.errName"));
      return;
    }
    if (cleanPhone.length < 8) {
      setError(t("signup.errPhone"));
      return;
    }
    if (!email.trim()) {
      setError(t("signup.errEmail"));
      return;
    }
    if (!isValidPassword(password)) {
      setError(t("signup.errPassword"));
      return;
    }

    setBusy(true);
    try {
      const res = await api.signup({ name: name.trim(), phone: cleanPhone, email: email.trim(), password, emirate });
      login(res.accessToken, res.customer);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("signup.genericError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Branding panel — desktop only */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-bg px-12 py-16 lg:flex lg:w-1/2">
        <div
          className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-2) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          <LogoMark diameter={120} />
          <h1 className="mt-8 text-4xl font-extrabold leading-tight text-text">
            {t("login.heroTitleLine1")}
            <br />
            <span className="bg-gradient-to-b from-accent-2 to-accent bg-clip-text text-transparent">
              {t("login.heroTitleLine2")}
            </span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">{t("signup.heroSubtitle")}</p>

          <div className="mt-10 grid w-full grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className="osta-card flex flex-col items-center gap-2 px-4 py-4">
                <Icon size={20} className="text-accent-2" />
                <span className="text-xs text-text-muted">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="w-16" />
            <LanguageToggle />
          </div>

          <div className="mb-8 flex flex-col items-center gap-4 lg:hidden">
            <LogoMark diameter={92} />
          </div>

          <div className="mb-8 hidden items-center justify-between lg:flex">
            <Logo size="md" />
            <LanguageToggle />
          </div>

          <div className="mb-6 text-center lg:text-start">
            <h1 className="text-xl font-bold text-text lg:text-2xl">{t("signup.title")}</h1>
            <p className="mt-1 text-sm text-text-muted">{t("signup.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="osta-card osta-glow-border flex flex-col gap-4 p-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{t("signup.fullName")}</span>
              <div className="flex items-center gap-2 rounded-xl osta-input px-3 py-3">
                <User size={18} className="text-text-faint" />
                <input
                  autoFocus
                  autoComplete="name"
                  placeholder={t("signup.fullNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{t("signup.mobile")}</span>
              <div className="flex items-center gap-2 rounded-xl osta-input px-3 py-3">
                <PhoneIcon size={18} className="text-text-faint" />
                <span className="text-sm text-text-muted">+971</span>
                <input
                  inputMode="numeric"
                  placeholder={t("signup.mobilePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{t("signup.email")}</span>
              <div className="flex items-center gap-2 rounded-xl osta-input px-3 py-3">
                <Mail size={18} className="text-text-faint" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t("signup.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{t("signup.emirate")}</span>
              <select
                value={emirate}
                onChange={(e) => setEmirate(e.target.value)}
                className="osta-input rounded-xl px-3 py-3 text-sm text-text"
              >
                {EMIRATES.map((e) => (
                  <option key={e} value={e}>
                    {t(`signup.emirates.${e}` as TranslationKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{t("signup.password")}</span>
              <div className="flex items-center gap-2 rounded-xl osta-input px-3 py-3">
                <Lock size={18} className="text-text-faint" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("signup.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                  className="text-text-faint"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="text-[11px] text-text-faint">{t("signup.passwordHint")}</span>
            </label>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="osta-btn-primary mt-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? t("signup.submitting") : t("signup.submit")}
            </button>

            <p className="text-center text-xs text-text-muted">
              {t("signup.haveAccount")}{" "}
              <Link href="/login" className="font-medium text-accent-2">
                {t("signup.loginLink")}
              </Link>
            </p>
          </form>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-text-faint lg:text-start">
            {t("signup.terms")}
          </p>
        </div>
      </div>
    </div>
  );
}
