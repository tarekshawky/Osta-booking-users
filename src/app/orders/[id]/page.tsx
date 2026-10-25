"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, FileText, Users, StickyNote, Star, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TopBar } from "@/components/TopBar";
import { FullPageSpinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { api, ApiError, OrderDetail } from "@/lib/api";

function Row({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon size={17} className="mt-0.5 text-text-faint" />
      <div>
        <p className="text-[11px] text-text-faint">{label}</p>
        <p className="text-sm text-text">{value}</p>
      </div>
    </div>
  );
}

function Stars({ value, onChange, size = 30 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-1.5" role={onChange ? "radiogroup" : "img"} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} role={onChange ? "radio" : undefined} aria-checked={onChange ? value === n : undefined} aria-label={`${n}`} onClick={() => onChange?.(n)} className={onChange ? "p-0.5" : "cursor-default p-0"}>
          <Star size={size} className={n <= value ? "fill-amber-400 text-amber-400" : "text-text-faint"} />
        </button>
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const { ready } = useRequireAuth();
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useLanguage();

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(iso: string | null) {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-AE" : "en-AE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [rateError, setRateError] = useState<string | null>(null);
  const [rating, setRating] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    api
      .order(token, params.id)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : t("orderDetail.failedToLoad")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, params.id]);

  async function submitRating() {
    if (!token || !order) return;
    if (stars < 1) return setRateError(t("orderDetail.rateChoose"));
    setRateError(null);
    setRating(true);
    try {
      await api.reviewOrder(token, order.id, { rating: stars, comment: comment.trim() || undefined });
      setOrder(await api.order(token, order.id)); // payment unlocks now
    } catch (err) {
      setRateError(err instanceof ApiError ? err.message : t("orderDetail.failedToLoad"));
    } finally {
      setRating(false);
    }
  }

  if (!ready) return <FullPageSpinner />;

  return (
    <AppShell>
      <TopBar title={t("orderDetail.title")} back />

      {error && (
        <p className="mx-5 mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      {!order ? (
        <FullPageSpinner />
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-5 py-5">
          <div className="osta-card p-4">
            <div className="mb-1 flex items-center justify-between">
              <StatusBadge status={order.status} />
            </div>
            <p className="text-lg font-bold text-text">{order.number}</p>
            <p className="text-xs text-text-muted">{order.orderType}</p>
          </div>

          <div className="osta-card divide-y divide-card-border px-4">
            <Row
              icon={FileText}
              label={t("orderDetail.service")}
              value={
                order.bookableService
                  ? `${lang === "ar" ? order.bookableService.nameAr : order.bookableService.nameEn} × ${order.quantity}`
                  : order.orderType
              }
            />
            <Row icon={Calendar} label={t("orderDetail.date")} value={formatDate(order.scheduledAt ?? order.date)} />
            {formatTime(order.scheduledAt) && (
              <Row icon={Clock} label={t("orderDetail.time")} value={formatTime(order.scheduledAt)!} />
            )}
            {order.locationUrl && <Row icon={MapPin} label={t("orderDetail.location")} value={order.locationUrl} />}
            <Row
              icon={FileText}
              label={t("orderDetail.amount")}
              value={order.priceAgreed === "No" ? t("orderDetail.notYetAgreed") : `${t("common.aed")} ${order.priceAgreed}`}
            />
            {order.team?.name && <Row icon={Users} label={t("orderDetail.team")} value={order.team.name} />}
            {order.assignedTo?.name && (
              <Row icon={Users} label={t("orderDetail.assignedTo")} value={order.assignedTo.name} />
            )}
            {order.notes && <Row icon={StickyNote} label={t("orderDetail.notes")} value={order.notes} />}
          </div>

          {order.events.length > 0 && (
            <div className="osta-card p-4">
              <p className="mb-2 text-xs font-semibold text-text-muted">{t("orderDetail.timeline")}</p>
              <ol className="flex flex-col gap-2">
                {order.events.map((e, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-text">{t(`orderDetail.events.${e.type}` as TranslationKey)}</span>
                    <span className="text-xs text-text-faint">{formatDate(e.createdAt)}</span>
                  </li>
                ))}
              </ol>
              {order.totalFils !== null && !order.events.some((e) => e.type === "CONFIRMED") && (
                <p className="mt-3 text-[11px] text-text-faint">{t("orderDetail.slotRequested")}</p>
              )}
            </div>
          )}

          {/* Rate first, then pay, and only then does the invoice appear. */}
          {order.canReview && (
            <div className="osta-card flex flex-col gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-text">{t("orderDetail.rateTitle")}</p>
                <p className="mt-0.5 text-xs text-text-muted">{t("orderDetail.rateSubtitle")}</p>
              </div>
              <Stars value={stars} onChange={(n) => { setStars(n); setRateError(null); }} />
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} placeholder={t("orderDetail.rateComment")} className="osta-input rounded-xl px-3 py-2 text-sm" />
              {rateError && <p role="alert" className="text-xs text-rose-300">{rateError}</p>}
              <button type="button" disabled={rating} onClick={() => void submitRating()} className="osta-btn-primary rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {rating ? t("orderDetail.rateSending") : t("orderDetail.rateSubmit")}
              </button>
            </div>
          )}

          {order.review && (
            <div className="osta-card flex items-center justify-between gap-3 p-4">
              <p className="text-xs text-text-muted">{t("orderDetail.rateThanks")}</p>
              <Stars value={order.review.rating} size={18} />
            </div>
          )}

          {order.payment && (
            <div className={`osta-card flex flex-col gap-3 p-4 ${order.payment.locked ? "opacity-70" : "osta-glow-border"}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">{t("orderDetail.payTitle")}</p>
                {order.payment.locked && <Lock size={16} className="text-text-faint" />}
              </div>
              <div>
                <p className="text-[11px] text-text-faint">{t("orderDetail.payAmount")}</p>
                <p className="text-2xl font-bold text-accent-2">{t("common.aed")} {order.payment.amount.toFixed(2)}</p>
              </div>
              {order.payment.locked ? (
                <p className="text-xs text-text-muted">{t("orderDetail.payLocked")}</p>
              ) : order.payment.link ? (
                <a href={order.payment.link} target="_blank" rel="noopener noreferrer" className="osta-btn-primary rounded-xl px-5 py-3 text-center text-sm font-semibold text-white">{t("orderDetail.payNow")}</a>
              ) : (
                <p className="text-xs text-text-muted">{t("orderDetail.payNoLink")}</p>
              )}
              {!order.payment.locked && <p className="text-[11px] text-text-faint">{t("orderDetail.payThenInvoice")}</p>}
            </div>
          )}

          {order.invoice && (
            <div className="osta-card flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-text-faint">{t("orderDetail.invoice")}</p>
                <p className="text-sm font-semibold text-text">{order.invoice.number}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.invoice.status} />
                <button
                  onClick={() => order.invoiceId && router.push(`/invoices/${order.invoiceId}`)}
                  className="text-xs font-medium text-accent-2"
                >
                  {t("common.view")}
                </button>
              </div>
            </div>
          )}

          {order.cancellationReason && (
            <div className="osta-card border border-rose-400/30 p-4">
              <p className="text-xs font-medium text-rose-300">{t("orderDetail.cancellationReason")}</p>
              <p className="mt-1 text-sm text-text-muted">{order.cancellationReason}</p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
