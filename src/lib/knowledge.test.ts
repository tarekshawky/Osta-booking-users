import { describe, expect, it } from "vitest";
import { factsText, faqJsonLd, glanceItems, normalizeText, safeSource, searchKnowledge, splitPhones, type Knowledge, type KnowledgeItem } from "./knowledge";

const item = (id: string, titleEn: string, bodyEn: string, o: Partial<KnowledgeItem> = {}): KnowledgeItem => ({ id, type: "FAQ", titleEn, titleAr: "", bodyEn, bodyAr: "", sourceUrl: "", verifiedAt: "2026-11-26T00:00:00.000Z", automatic: false, schema: true, ...o });
const items = [
  item("areas", "Which areas does Osta Services cover?", "Dubai, Ajman and Al Ain."),
  item("warranty", "Is there a warranty?", "The standard workmanship warranty is 14 days."),
  item("contact", "Phone", "+971 56 867 6036", { type: "FACT", automatic: true, schema: false }),
  item("arabic", "Cleaning", "x", { titleAr: "هل تنظفون المكيفات؟", bodyAr: "نعم، تنظيف المكيفات متاح في عجمان." }),
];
const k: Knowledge = { indexable: false, llms: false, latestCheck: null, sections: [{ key: "company", titleEn: "Company", titleAr: "", items: [items[2], item("long", "About", "x".repeat(400), { type: "FACT" })] }, { key: "faq", titleEn: "FAQ", titleAr: "", items: [items[0], items[1]] }] };

describe("search", () => {
  it("finds the checked answer by the words that matter", () => {
    expect(searchKnowledge(items, "Do you cover Al Ain?", "en")[0].id).toBe("areas");
    expect(searchKnowledge(items, "warranty", "en")[0].id).toBe("warranty");
  });
  it("gives nothing rather than a loose match", () => {
    expect(searchKnowledge(items, "do you sell solar panels in London", "en")).toEqual([]);
    expect(searchKnowledge(items, "what is the", "en")).toEqual([]);
    expect(searchKnowledge(items, "ac", "en").map((i) => i.id)).not.toContain("contact");
  });
  it("matches Arabic whatever the hamza, diacritics or article", () => {
    expect(normalizeText("تَنْظيف المكيّفاتِ")).toBe("تنظيف المكيفات");
    expect(searchKnowledge(items, "تنظيف مكيفات", "ar")[0].id).toBe("arabic");
  });
});

describe("page data", () => {
  it("keeps only short company lines in the at-a-glance table", () => {
    expect(glanceItems(k, "en").map((i) => i.id)).toEqual(["contact"]);
    expect(factsText(glanceItems(k, "en"), "en")).toBe("Phone: +971 56 867 6036");
  });
  it("marks up only typed questions that allow it", () => {
    expect(faqJsonLd(k, "en")?.mainEntity.map((q) => q.name)).toEqual([items[0].titleEn, items[1].titleEn]);
    expect(faqJsonLd({ ...k, sections: [] }, "en")).toBeNull();
  });
  it("picks out phone numbers so they can be kept left to right", () => {
    expect(splitPhones("واتساب +971 56 867 6036، أو البريد")).toEqual(["واتساب ", "+971 56 867 6036", "، أو البريد"]);
    expect(splitPhones("+971568676036")).toEqual(["", "+971568676036", ""]);
    expect(splitPhones("AED 699 to 2,299 in 2026")).toEqual(["AED 699 to 2,299 in 2026"]);
  });
  it("accepts only safe source links", () => {
    expect([safeSource("https://x.com/a"), safeSource("/policies"), safeSource("javascript:alert(1)"), safeSource("//evil.com"), safeSource("")]).toEqual([true, true, false, false, false]);
  });
});
