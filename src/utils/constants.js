// App Info (override via .env)
export const APP_NAME = process.env.REACT_APP_NAME || "Meghali's Silk";
export const APP_TAGLINE = "Heritage handloom silk, woven for you";
export const APP_DESCRIPTION = "Authentic women's silk sarees and ethnic wear, handwoven by master artisans – free shipping, easy returns, 100% genuine silk";

// Routes
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:slug",
  PROFILE: "/profile",
  ORDERS: "/orders",
  ORDER_CONFIRMATION: "/order-confirmation",
  CHECKOUT: "/checkout",
  WISHLIST: "/wishlist",
  SUPPORT: "/support",
  HELP: "/help",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  REFUND: "/refund",
  COOKIES: "/cookies",
  SPECIAL_OFFERS: "/special-offers",
};

// Product flags
export const PRODUCT_FLAGS = {
  FEATURED: "featured",
  TRENDING: "trending",
  HOT: "hot",
  NEW: "new",
  SALE: "sale",
};

// Payment methods
export const PAYMENT_METHODS = {
  CARD: "card",
  UPI: "upi",
  COD: "cod",
  WALLET: "wallet",
  NET_BANKING: "net_banking",
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
  REFUNDED: "refunded",
};

// Fulfillment statuses
export const FULFILLMENT_STATUS = {
  UNFULFILLED: "unfulfilled",
  PARTIALLY_FULFILLED: "partially_fulfilled",
  FULFILLED: "fulfilled",
  RETURNED: "returned",
};

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  PARTIALLY_PAID: "partially_paid",
  REFUNDED: "refunded",
  VOIDED: "voided",
};

// Return statuses
export const RETURN_STATUS = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  RECEIVED: "received",
  REFUNDED: "refunded",
};

// Return reasons
export const RETURN_REASONS = [
  { value: "defective", label: "Defective / Damaged" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "not_as_described", label: "Not As Described" },
  { value: "changed_mind", label: "Changed Mind" },
  { value: "size_fit", label: "Size / Fit Issue" },
  { value: "quality", label: "Quality Not Satisfactory" },
  { value: "other", label: "Other" },
];

// Currencies
export const CURRENCIES = {
  INR: { symbol: "₹", code: "INR", name: "Indian Rupee" },
  USD: { symbol: "$", code: "USD", name: "US Dollar" },
  EUR: { symbol: "€", code: "EUR", name: "Euro" },
  GBP: { symbol: "£", code: "GBP", name: "British Pound" },
};
export const DEFAULT_CURRENCY = CURRENCIES.INR;

// Shipping
// Single source of truth for the free-shipping threshold. Mirrors the
// Standard shipping method's `freeAbove` value in db.json (₹999) and is
// shared by the Header banner and the CartDrawer progress bar.
export const FREE_SHIPPING_THRESHOLD = 999;

// Social links (sensible defaults — update per project). The Footer renders an
// icon only for entries with a non-empty URL, so blanking one here hides it
// instead of leaving a dead link.
export const SOCIAL_LINKS = {
  FACEBOOK: "https://facebook.com/meghalissilk",
  TWITTER: "https://twitter.com/meghalissilk",
  INSTAGRAM: "https://instagram.com/meghalissilk",
  YOUTUBE: "https://youtube.com/@meghalissilk",
  WHATSAPP: "https://wa.me/919830000000",
};

// Store contact (Meghali's Silk — Kolkata). Single source so the Header top bar,
// Footer, Help Center and Support/Contact page all stay in sync.
export const SUPPORT_EMAIL = "care@meghalissilk.com";
export const SUPPORT_PHONE = "+91 98300 00000";
export const SUPPORT_ADDRESS =
  "Galleria Producer Company Limited, 42 Rashbehari Avenue, Kolkata, West Bengal 700001";
export const SUPPORT_HOURS = "Mon – Sat: 10:00 AM – 7:00 PM IST";

// Date the legal/policy pages were last reviewed. Single source so the Privacy,
// Terms, Cookie and Refund pages never show contradictory "last updated" dates.
export const POLICY_LAST_UPDATED = "June 1, 2026";

// FAQs — one shared set, read on three surfaces: the Help Centre (/help), the
// home FAQ block and the PDP's FAQ panel. The copy therefore has to work both
// beside a single product and on its own, and every number in it is one the
// store actually runs on — the windows and thresholds come from the shipping
// methods, the Cash-on-Delivery ceiling from the payment settings, and the
// return window from the Refund Policy page. Nothing here is invented.
export const FAQ_ITEMS = [
  {
    id: 1,
    question: "How should I care for Muga, Pat and Eri silk?",
    answer:
      "Dry-clean for the first couple of years, then a gentle cold hand wash with a mild detergent — Muga in particular grows softer and deepens in lustre each time it is washed. Dry in the shade, never in direct sun, and press on the reverse with a warm iron. Store the piece folded in unbleached muslin rather than plastic, refold it along a different line every few months so no crease ever sets, and keep perfume and deodorant off the fabric.",
  },
  {
    id: 2,
    question: "Is the silk really handwoven in Assam?",
    answer:
      "Yes. Every piece is woven on a handloom and bought directly from weaving families in and around Sualkuchi, the weaving village on the north bank of the Brahmaputra. Undyed Muga is sold undyed — the deep honey gold is the fibre's own colour and not a dye — and Eri is handspun before it is woven. Each product page carries the details the weaver gave us for that particular piece.",
  },
  {
    id: 3,
    question: "What is the difference between Muga, Pat, Eri and Nuni silk?",
    answer:
      "Muga is the golden silk unique to Assam — undyed, unusually strong, and it only improves with age. Pat is the bright ivory-to-white mulberry silk, the one most often woven with zari for weddings and festivals. Eri is soft, matte and handspun; it behaves more like a fine wool and is warm to wear, which is why it is used for shawls and stoles. Nuni is a mulberry silk with a quieter, everyday finish. Every listing states which of them the piece is woven in.",
  },
  {
    id: 4,
    question: "What comes in a Mekhela Chador set, and does it arrive stitched?",
    answer:
      "A set is the two-piece drape: the mekhela, worn as the lower wrap, and the chador that goes over it. Both arrive unstitched and unpleated so your tailor can pleat, hem and finish them to your own measurements. A matching blouse piece is listed separately where one has been woven for the set. Lengths and widths appear on the product page wherever the weaver has supplied them — if a measurement you need is not listed, write to us before you order.",
  },
  {
    id: 5,
    question: "How long does delivery take, and is shipping free?",
    answer:
      "Standard delivery reaches most of India in 5-7 business days and is free on orders above ₹999. Express delivery arrives in 2-3 business days, and same-day delivery is available within select Kolkata pin codes. Every order is packed in insured silk packaging, and the exact delivery charge for your address is shown at checkout before you pay.",
  },
  {
    id: 6,
    question: "What is your return policy?",
    answer:
      "We offer a 7-day return. Request one from My Orders within 7 days of delivery and send the piece back unworn, unwashed and with its original tags and packaging intact. Once it reaches us and passes inspection, the refund is processed to your original payment method within 5-7 business days. Blouses stitched to measure and made-to-order pieces cannot be returned, since they were finished to your own measurements.",
  },
  {
    id: 7,
    question: "Which payments do you accept, and is Cash on Delivery available?",
    answer:
      "UPI, credit and debit cards, net banking and wallets are all accepted, and every payment is handled over an encrypted connection by the payment gateway. Cash on Delivery is available on orders up to ₹50,000 across most pin codes in India. Prices are shown exclusive of GST, which is calculated at checkout.",
  },
  {
    id: 8,
    question: "How do I track my order?",
    answer:
      "You will receive an email with a tracking number as soon as your order is dispatched. You can also follow it at any time from the My Orders section of your account, where the current stage of every order is shown.",
  },
];

// Why choose us
export const WHY_CHOOSE_US = [
  {
    id: 1,
    title: "Premium Quality Silk",
    description: "Handwoven pure silk, inspected by hand for purity and finish",
    icon: "mdi:diamond-stone",
  },
  {
    id: 2,
    title: "100% Authentic",
    description: "Traceable, genuine Bengal handloom silk — guaranteed",
    icon: "mdi:check-decagram",
  },
  {
    id: 3,
    title: "Free Shipping ₹999+",
    description: "Complimentary delivery on every order above ₹999",
    icon: "mdi:truck-fast",
  },
  {
    id: 4,
    title: "Expert Support",
    description: "Our silk experts are here to guide every purchase",
    icon: "mdi:headset",
  },
];

// Framer Motion animation variants
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
  },
  slideDown: {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 50, opacity: 0 },
  },
  slideLeft: {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  },
  slideRight: {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 50, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
};

// Breakpoints
export const BREAKPOINTS = {
  XS: 480,
  SM: 768,
  MD: 1024,
  LG: 1280,
  XL: 1440,
};

// Trust badges
export const TRUST_BADGES = [
  "7-Day Easy Returns",
  "100% Money Back",
  "Free Shipping",
  "Authentic Silk",
];
