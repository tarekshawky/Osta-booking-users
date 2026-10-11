// A booking started on the public price page, carried through login into the booking flow.
// sessionStorage only: it dies with the tab and never leaves the browser.
const KEY = "osta_booking_draft";

export type BookingDraft = {
  regionId: string;
  serviceId: string;
  typeId: string;
  qty: number;
  addOnIds: string[];
  consent: boolean;
};

export function saveDraft(draft: BookingDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage blocked: the customer simply re-selects in the booking flow.
  }
}

export function hasDraft(): boolean {
  try {
    return !!sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function loadDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<BookingDraft>;
    if (typeof d.regionId !== "string" || typeof d.serviceId !== "string" || typeof d.typeId !== "string" || typeof d.qty !== "number") return null;
    return { regionId: d.regionId, serviceId: d.serviceId, typeId: d.typeId, qty: d.qty, addOnIds: Array.isArray(d.addOnIds) ? d.addOnIds.filter((x) => typeof x === "string") : [], consent: d.consent === true };
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
