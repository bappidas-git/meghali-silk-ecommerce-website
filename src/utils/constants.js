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

// FAQs
export const FAQ_ITEMS = [
  {
    id: 1,
    question: "How long does delivery take, and is shipping free?",
    answer:
      "Standard delivery takes 5-7 business days, and shipping is free on all orders above ₹999. Express delivery is available in 2-3 business days, with same-day delivery in select metro cities. Every silk piece is carefully packed to reach you in perfect condition.",
  },
  {
    id: 2,
    question: "What is your return policy?",
    answer:
      "We offer a 7-day hassle-free return policy. If your silk saree or outfit isn't quite right, you can request a return within 7 days of delivery as long as it's unworn, unwashed and has its original tags intact. Refunds are processed within 5-7 business days of inspection.",
  },
  {
    id: 3,
    question: "Is payment secure?",
    answer:
      "Yes, all payments are processed through industry-standard SSL encryption. We support UPI, credit/debit cards, net banking, and Cash on Delivery.",
  },
  {
    id: 4,
    question: "Do you offer Cash on Delivery?",
    answer:
      "Yes, Cash on Delivery is available on orders up to ₹50,000 in most pin codes across India.",
  },
  {
    id: 5,
    question: "How do I track my order?",
    answer:
      "Once your order is shipped, you'll receive an email with a tracking number. You can track your order from the 'My Orders' section in your account.",
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
