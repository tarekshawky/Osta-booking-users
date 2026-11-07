"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, Check, Circle, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { COUNTRIES } from "@/lib/authRules";
import { useLanguage } from "@/lib/language-context";

// The building blocks of the sign-in forms: a labelled field with its own error line, password and phone inputs, a rules
// checklist and an alert box. Everything is a real <label>/<input>, so keyboard and screen readers work as expected.

export function Field({ label, error, hint, htmlFor, children }: { label: string; error?: string | null; hint?: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-[#b9c9e4]">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-[#7f93b8]">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-rose-300"><AlertCircle size={13} aria-hidden />{error}</p>}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & { id: string; invalid?: boolean };

const ICONS = { mail: Mail, user: User, lock: Lock, phone: Phone };

export function TextInput({ icon, invalid, ltr, ...props }: InputProps & { icon?: keyof typeof ICONS; ltr?: boolean }) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <div className="auth-field" data-invalid={invalid ? "true" : undefined}>
      {Icon && <Icon size={18} className="shrink-0 text-[#7f93b8]" aria-hidden />}
      <input {...props} dir={ltr ? "ltr" : undefined} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${props.id}-error` : undefined} className={ltr ? "text-start" : undefined} />
    </div>
  );
}

export function PasswordInput({ show, onToggle, invalid, ...props }: InputProps & { show: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="auth-field" data-invalid={invalid ? "true" : undefined}>
      <Lock size={18} className="shrink-0 text-[#7f93b8]" aria-hidden />
      <input {...props} type={show ? "text" : "password"} dir="ltr" aria-invalid={invalid || undefined} aria-describedby={invalid ? `${props.id}-error` : undefined} className="text-start" />
      <button type="button" onClick={onToggle} aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={show} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#7f93b8] transition-colors hover:text-white">
        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}

// Country code (UAE +971 first) next to the number. The code is a real <select>, so it works with the keyboard and on phones.
export function PhoneInput({ dial, onDial, invalid, ...props }: InputProps & { dial: string; onDial: (d: string) => void }) {
  const { t, lang } = useLanguage();
  const selectId = useId();
  return (
    <div className="auth-field" data-invalid={invalid ? "true" : undefined}>
      <label htmlFor={selectId} className="sr-only">{t("auth.countryCode")}</label>
      <select id={selectId} value={dial} onChange={(e) => onDial(e.target.value)} dir="ltr" className="!flex-none w-[5.4rem] cursor-pointer appearance-none text-sm font-semibold">
        {COUNTRIES.map((c) => (<option key={c.dial} value={c.dial}>{`+${c.dial} ${c.name[lang]}`}</option>))}
      </select>
      <span className="h-5 w-px shrink-0 bg-[rgba(145,165,199,0.35)]" aria-hidden />
      <input {...props} type="tel" inputMode="tel" dir="ltr" aria-invalid={invalid || undefined} aria-describedby={invalid ? `${props.id}-error` : undefined} className="text-start" />
    </div>
  );
}

export function Rules({ items }: { items: { ok: boolean; label: string }[] }) {
  return (
    <ul className="flex flex-col gap-1.5" aria-live="polite">
      {items.map((r) => (
        <li key={r.label} className={`flex items-center gap-2 text-xs transition-colors ${r.ok ? "text-emerald-300" : "text-[#7f93b8]"}`}>
          {r.ok ? <Check size={14} aria-hidden /> : <Circle size={14} aria-hidden />}
          {r.label}
        </li>
      ))}
    </ul>
  );
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${tone === "error" ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>
      {tone === "error" ? <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> : <Check size={16} className="mt-0.5 shrink-0" aria-hidden />}
      <span>{children}</span>
    </p>
  );
}

export function SubmitButton({ busy, label, busyLabel, disabled }: { busy: boolean; label: string; busyLabel: string; disabled?: boolean }) {
  return (
    <button type="submit" disabled={busy || disabled} aria-busy={busy} className="auth-btn text-base">
      {busy && <span className="auth-spinner" aria-hidden />}
      {busy ? busyLabel : label}
    </button>
  );
}

export function Checkbox({ id, checked, onChange, invalid, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; invalid?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-[#b9c9e4]">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={invalid || undefined} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#087bff]" />
      <span>{children}</span>
    </label>
  );
}
