// A booking started on the public price page, carried through login into the booking flow.
// sessionStorage only: it dies with the tab and never leaves the browser.
const KEY = "osta_booking_draft";

export type BookingDraft = {
  regionId: string;
  serviceId: string;
  typeId: string;
  optionId?: string;
  qty: number;
  addOnIds: string[];
  consent: boolean;
  // When the choice was made. A draft older than a few hours is ignored.
  savedAt?: number;
};

const MAX_AGE_MS = 3 * 60 * 60 * 1000;

export function saveDraft(draft: BookingDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Storage blocked: the customer simply re-selects in the booking flow.
  }
}

export function hasDraft(): boolean {
  try {
    return loadDraft() !== null;
  } catch {
    return false;
  }
}

export function loadDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<BookingDraft>;
    if (typeof d.savedAt === "number" && Date.now() - d.savedAt > MAX_AGE_MS) return null;
    if (typeof d.regionId !== "string" || typeof d.serviceId !== "string" || typeof d.typeId !== "string" || typeof d.qty !== "number") return null;
    return { regionId: d.regionId, serviceId: d.serviceId, typeId: d.typeId, optionId: typeof d.optionId === "string" ? d.optionId : undefined, qty: d.qty, addOnIds: Array.isArray(d.addOnIds) ? d.addOnIds.filter((x) => typeof x === "string") : [], consent: d.consent === true };
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
