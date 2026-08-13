"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone as PhoneIcon, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function normalizePhone(raw: string) {
  return raw.replace(/[^\d]/g, "").replace(/^0+/, "");
}

export default function LoginPage() {
  const router = useRouter();
  const { token, loading, login } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && token) router.replace("/dashboard");
  }, [loading, token, router]);

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 8) {
      setError("Enter a valid mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.requestOtp(cleanPhone);
      setDevCode(res.devCode ?? null);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 4) {
      setError("Enter the code you received.");
      return;
    }
    setBusy(true);
    try {
      const cleanPhone = normalizePhone(phone);
      const res = await api.verifyOtp(cleanPhone, code.trim());
      login(res.accessToken, res.customer);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-4">
        <LogoMark diameter={92} />
        <div className="text-center">
          <h1 className="text-xl font-bold text-text">Welcome to OSTA Services</h1>
          <p className="mt-1 text-sm text-text-muted">
            {step === "phone"
              ? "Login to continue to your account"
              : `Enter the code sent to +971 ${phone}`}
          </p>
        </div>
      </div>

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="osta-card osta-glow-border flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Mobile number</span>
            <div className="flex items-center gap-2 rounded-xl osta-input px-3 py-3">
              <PhoneIcon size={18} className="text-text-faint" />
              <span className="text-sm text-text-muted">+971</span>
              <input
                autoFocus
                inputMode="numeric"
                placeholder="50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
              />
            </div>
          </label>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="osta-btn-primary mt-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Sending code…" : "Login / Sign In"}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-text-faint">
            By continuing, you agree to our Terms &amp; Conditions and Privacy Policy
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="osta-card osta-glow-border flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Verification code</span>
            <div className="flex items-center gap-2 rounded-xl osta-input px-3 py-3">
              <ShieldCheck size={18} className="text-text-faint" />
              <input
                autoFocus
                inputMode="numeric"
                placeholder="482913"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-transparent text-sm tracking-[0.3em] text-text outline-none placeholder:tracking-normal placeholder:text-text-faint"
              />
            </div>
          </label>

          {devCode && (
            <p className="text-xs text-accent-2">
              Dev mode: your code is <span className="font-semibold">{devCode}</span>
            </p>
          )}
          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="osta-btn-primary mt-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & Continue"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
            className="text-center text-xs text-text-muted"
          >
            Use a different number
          </button>
        </form>
      )}
    </div>
  );
}
