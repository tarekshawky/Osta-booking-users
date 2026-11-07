import { describe, it, expect } from "vitest";
import { STATUS_TEXT, STATUS_TONE, clauseBlocks, dateText, money } from "./agreementText";

describe("agreement text helpers", () => {
  it("has a label and a colour for every agreement status, in both languages", () => {
    for (const s of ["DRAFT", "PENDING_APPROVAL", "CHANGES_REQUESTED", "AWAITING_PAYMENT", "ACTIVE", "EXPIRED", "CANCELLED", "REJECTED"] as const) {
      expect(STATUS_TEXT[s].en && STATUS_TEXT[s].ar, s).toBeTruthy(); expect(STATUS_TONE[s], s).toBeTruthy();
    }
  });
  it("formats money in the reader's language, and a missing price as a custom quotation", () => {
    expect(money(1679, "en")).toBe("AED 1,679"); expect(money(1679.5, "ar")).toBe("1,679.5 د.إ");
    expect(money(null, "en")).toBe("Custom quotation"); expect(money(null, "ar")).toBe("عرض سعر مخصص");
  });
  it("formats dates in Dubai time with Latin digits", () => {
    expect(dateText("2026-11-07T21:00:00Z", "en")).toBe("08 November 2026"); // already the next day in Dubai
    expect(dateText(null, "en")).toBe("—"); expect(/[0-9]{4}/.test(dateText("2026-11-07T10:00:00Z", "ar"))).toBe(true);
  });
  it("splits a clause into paragraphs and bullets", () => {
    const blocks = clauseBlocks("Intro line.\n\nThese include:\n- One\n- Two\n\nClosing.");
    expect(blocks).toEqual([{ text: "Intro line.", bullets: [] }, { text: "These include:", bullets: ["One", "Two"] }, { text: "Closing.", bullets: [] }]);
  });
});
