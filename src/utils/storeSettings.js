// =============================================================================
// Store settings — shape, defaults and normalisation
// =============================================================================
// The admin's Settings > General screen writes two sections of the `settings`
// record in db.json: `store` (identity, currency, tax) and `payment` (Cash on
// Delivery). Everything the storefront and the admin shell render from those
// values goes through here first, so a half-filled or missing record can never
// blank the header, the footer or a price.
//
// Falling back to the constants (rather than to empty strings) is deliberate:
// the constants are the values the site was built with, so an unreachable API
// degrades to the same page the visitor saw yesterday instead of an anonymous
// one. A field the admin has explicitly cleared still falls back — an empty
// store name is never a deliberate choice, and a blank <title> is worse than a
// stale one.
// =============================================================================
import {
  APP_NAME,
  APP_TAGLINE,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_ADDRESS,
  FREE_SHIPPING_THRESHOLD,
} from "./constants";

// Currencies the admin can pick from. The symbol is what actually gets printed
// (see formatMoney), so this map is the single source shared by the Settings
// dropdown and every price on the site.
export const SUPPORTED_CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar (C$)" },
];

export const DEFAULT_STORE_SETTINGS = {
  store: {
    name: APP_NAME,
    tagline: APP_TAGLINE,
    email: SUPPORT_EMAIL,
    phone: SUPPORT_PHONE,
    address: SUPPORT_ADDRESS,
    currency: "INR",
    currencySymbol: "₹",
    taxRate: 5,
    taxIncluded: false,
  },
  payment: {
    codEnabled: true,
    codFee: 0,
    codMinOrder: 0,
    codMaxOrder: 0,
  },
};

// A trimmed string, or the fallback when the field is missing/blank.
const text = (value, fallback) => {
  const s = typeof value === "string" ? value.trim() : "";
  return s || fallback;
};

// A finite number clamped to >= 0, or the fallback. Guards against the strings
// json-server hands back when a numeric field was typed into a text input.
const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const normalizeStoreSettings = (raw) => {
  const store = raw?.store || {};
  const payment = raw?.payment || {};
  const d = DEFAULT_STORE_SETTINGS;

  const currency = text(store.currency, d.store.currency).toUpperCase();
  const known = SUPPORTED_CURRENCIES.find((c) => c.code === currency);

  return {
    store: {
      name: text(store.name, d.store.name),
      tagline: text(store.tagline, d.store.tagline),
      email: text(store.email, d.store.email),
      phone: text(store.phone, d.store.phone),
      address: text(store.address, d.store.address),
      currency,
      // An admin-typed symbol wins over the table, so currencies outside the
      // dropdown (or a store that prefers "Rs.") print exactly what was saved.
      currencySymbol: text(store.currencySymbol, known ? known.symbol : currency),
      taxRate: Math.min(100, num(store.taxRate, d.store.taxRate)),
      taxIncluded: !!store.taxIncluded,
    },
    payment: {
      codEnabled: payment.codEnabled !== false,
      codFee: num(payment.codFee, 0),
      codMinOrder: num(payment.codMinOrder, 0),
      // 0 means "no maximum" in the admin form; normalise it to null so callers
      // test for absence rather than for a magic zero.
      codMaxOrder: num(payment.codMaxOrder, 0) || null,
    },
  };
};

// Shared copy (the FAQ answers, the promise strip) quotes figures the admin
// owns. Rather than freeze them into the string, those lines carry a token and
// this fills it in — so one edit in Settings > General re-words every surface
// that renders the copy instead of leaving a contradiction on the page.
export const fillStoreCopy = (text, settings) => {
  if (typeof text !== "string" || !text.includes("{")) return text;
  const { store, payment } = settings;
  const money = (n) =>
    formatMoney(n, {
      currency: store.currency,
      currencySymbol: store.currencySymbol,
      decimals: 0,
    });

  const codSentence = !payment.codEnabled
    ? "Cash on Delivery is not currently offered."
    : payment.codMaxOrder
    ? `Cash on Delivery is available on orders up to ${money(
        payment.codMaxOrder
      )} across most pin codes in India.`
    : "Cash on Delivery is available across most pin codes in India.";

  const taxNote = store.taxIncluded
    ? `inclusive of ${store.taxRate}% tax`
    : `exclusive of ${store.taxRate}% tax, which is calculated at checkout`;

  return text
    .split("{freeShipping}").join(money(FREE_SHIPPING_THRESHOLD))
    .split("{codSentence}").join(codSentence)
    .split("{taxNote}").join(taxNote);
};

// Indian numbering (1,00,000) for INR, Western grouping (100,000) otherwise.
export const localeForCurrency = (code) => (code === "INR" ? "en-IN" : "en-US");

// Print `amount` with the store's symbol.
//
// Deliberately NOT Intl's `style: "currency"`: that ignores a custom symbol and
// throws a RangeError on any code it does not recognise, so one typo in the
// admin's Currency field would take down every page that shows a price. Here
// the number is grouped by Intl and the symbol is simply prefixed.
export const formatMoney = (amount, { currency, currencySymbol, decimals = 2 } = {}) => {
  const code = currency || DEFAULT_STORE_SETTINGS.store.currency;
  const symbol = currencySymbol || code;
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  const body = new Intl.NumberFormat(localeForCurrency(code), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(safe));
  return `${safe < 0 ? "-" : ""}${symbol}${body}`;
};
