// =============================================================================
// FAQs — shared shape, defaults and normalizers
// =============================================================================
//
// Every answered question on the storefront now comes from ONE admin-managed
// collection, `faqs`, and three surfaces read it:
//
//   PRODUCT PAGES  the "FAQs" tab on the PDP. A row with no product targeting
//                  appears on every product; a row targeted at specific
//                  products appears only on those, above the general ones.
//   HELP CENTRE    /help — the searchable list of answers.
//   SHARED BLOCK   the reusable "Frequently Asked Questions" section.
//
// A row carries its own placements, so an answer written for one product page
// need not turn up in the Help Centre, and a policy answer need not be repeated
// on every listing.
//
// FALLING BACK TO THE CONSTANTS IS DELIBERATE
//   DEFAULT_FAQS is FAQ_ITEMS — the set the site shipped with. An unreachable
//   API therefore degrades to the same answers the visitor read yesterday
//   rather than to an empty accordion (the same rule storeSettings.js follows).
//
// THE ANSWERS QUOTE THE STORE'S OWN FIGURES
//   {freeShipping}, {codSentence} and {taxNote} are filled from Settings >
//   General at render time by fillStoreCopy, so one edit there re-words every
//   answer that quotes a threshold instead of leaving a contradiction on the
//   page. Admins can type those tokens into an answer here too.
// =============================================================================

import { FAQ_ITEMS } from "./constants";

// ─── Vocabularies (shared by the admin controls and the readers) ─────────────

export const FAQ_PLACEMENTS = [
  {
    value: "product",
    label: "Product pages",
    short: "Product",
    icon: "mdi:package-variant-closed",
    hint: "The FAQs tab on a product page",
  },
  {
    value: "help",
    label: "Help centre",
    short: "Help",
    icon: "mdi:lifebuoy",
    hint: "The searchable answers at /help",
  },
  {
    value: "home",
    label: "Shared FAQ block",
    short: "Shared",
    icon: "mdi:frequently-asked-questions",
    hint: "The reusable Frequently Asked Questions section",
  },
];

export const FAQ_PLACEMENT_VALUES = FAQ_PLACEMENTS.map((p) => p.value);

export const faqPlacementMeta = (value) =>
  FAQ_PLACEMENTS.find((p) => p.value === value) || null;

// The tokens an answer may carry. Surfaced in the editor so an admin can quote
// a figure without freezing today's number into the copy.
export const FAQ_COPY_TOKENS = [
  { token: "{freeShipping}", hint: "Free-shipping threshold" },
  { token: "{codSentence}", hint: "The current Cash on Delivery rule, as a sentence" },
  { token: "{taxNote}", hint: "Whether prices include tax, and at what rate" },
];

export const DEFAULT_FAQ = {
  question: "",
  answer: "",
  placements: [...FAQ_PLACEMENT_VALUES],
  productIds: [],
  isActive: true,
  sortOrder: 0,
};

// The built-in set, in the order it has always been read.
export const DEFAULT_FAQS = FAQ_ITEMS.map((item, index) => ({
  ...DEFAULT_FAQ,
  id: item.id,
  question: item.question,
  answer: item.answer,
  sortOrder: index,
}));

// ─── Normalisation ───────────────────────────────────────────────────────────

const text = (value) => (typeof value === "string" ? value.trim() : "");

const idList = (value) =>
  Array.isArray(value)
    ? value.filter((id) => id !== null && id !== undefined && id !== "")
    : [];

// One row, defensive about every field: an older record (or a half-saved one)
// still renders rather than throwing somewhere down in an accordion.
export const normalizeFaq = (raw, index = 0) => {
  const source = raw && typeof raw === "object" ? raw : {};
  const placements = Array.isArray(source.placements)
    ? source.placements.filter((p) => FAQ_PLACEMENT_VALUES.includes(p))
    : // A record written before placements existed belongs everywhere, which is
      // exactly how the constants behaved.
      [...FAQ_PLACEMENT_VALUES];

  const sortOrder = Number(source.sortOrder);

  return {
    ...(source.id !== undefined ? { id: source.id } : {}),
    // `q`/`a` are accepted because product-inline FAQs have always allowed them.
    question: text(source.question || source.q),
    answer: text(source.answer || source.a),
    placements,
    productIds: idList(source.productIds),
    isActive: source.isActive !== false,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : index,
    ...(source.createdAt ? { createdAt: source.createdAt } : {}),
    ...(source.updatedAt ? { updatedAt: source.updatedAt } : {}),
  };
};

// The whole collection, in the order the admin arranged it. Ties fall back to
// id so the list can never shuffle between two reads.
export const normalizeFaqs = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => normalizeFaq(row, index))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, {
        numeric: true,
      });
    });
};

// ─── Reading ─────────────────────────────────────────────────────────────────

const isAnswered = (faq) => !!(faq.question && faq.answer);

export const isFaqLive = (faq) => !!faq && faq.isActive && isAnswered(faq);

export const faqHasPlacement = (faq, placement) =>
  Array.isArray(faq?.placements) && faq.placements.includes(placement);

// Whether a row is aimed at one product in particular.
export const faqIsTargeted = (faq) =>
  Array.isArray(faq?.productIds) && faq.productIds.length > 0;

export const faqTargetsProduct = (faq, product) => {
  if (!faqIsTargeted(faq)) return false;
  const ids = new Set(faq.productIds.map((id) => String(id)));
  return (
    ids.has(String(product?.id)) ||
    (product?.slug ? ids.has(String(product.slug)) : false)
  );
};

// Drop questions the same wording has already answered, keeping the first —
// which is why the caller orders product-specific rows ahead of general ones.
const dedupe = (faqs) => {
  const seen = new Set();
  return faqs.filter((faq) => {
    const key = faq.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// The Help Centre and the shared block: live rows carrying that placement, and
// never a row written for one product in particular.
export const faqsForPlacement = (faqs, placement) =>
  dedupe(
    (Array.isArray(faqs) ? faqs : [])
      .filter(isFaqLive)
      .filter((faq) => faqHasPlacement(faq, placement))
      .filter((faq) => !faqIsTargeted(faq))
  );

// A product page: the product's own inline FAQs first (a legacy `product.faqs`
// array still works), then the rows aimed at this product, then the general
// product-page rows — de-duped by question, so the most specific answer wins.
export const faqsForProduct = (faqs, product) => {
  const managed = (Array.isArray(faqs) ? faqs : [])
    .filter(isFaqLive)
    .filter((faq) => faqHasPlacement(faq, "product"));
  const inline = (Array.isArray(product?.faqs) ? product.faqs : [])
    .map((faq, index) => normalizeFaq(faq, index))
    .filter(isAnswered);

  return dedupe([
    ...inline,
    ...managed.filter((faq) => faqTargetsProduct(faq, product)),
    ...managed.filter((faq) => !faqIsTargeted(faq)),
  ]);
};
