import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useOrder } from "../../context/OrderContext";
import apiService from "../../services/api";
import {
  formatCurrency,
  PLACEHOLDER_IMG,
  onImageError,
} from "../../utils/helpers";
import { STOREFRONT_CONFIG } from "../../theme/tokens";
import styles from "./Checkout.module.css";

// =============================================================================
// CHECKOUT — the editorial counter
// =============================================================================
// A focused, low-noise flow: a serif title, one hairline step line, a single
// content column and a quiet summary rail. What used to shout — the bubbly
// numbered stepper, the framed cards, the emoji trust badges — is gone; what is
// left is type, hairlines and one ink button.
//
// WHAT DID NOT CHANGE (and must not)
//   • The 4-step state machine. `step` 0–3 over STEPS, `handleNext`'s gating
//     (empty-cart bail → auth gate → validateAddress + selectedShipping), Back
//     as setStep(step - 1), the scroll-to-top effect, the AnimatePresence keys
//     ("cart" / "shipping" / "payment" / "review") and the Review step's Edit
//     jumps (setStep(1) / setStep(2)).
//   • Every number. subtotal from getCartTotal, couponDiscountFor, the shipping
//     free/flat rule, taxRatePct from settings.store.taxRate ?? 5, `total`, and
//     the storeCredit / amountPayable pair — no formula or rounding was touched.
//   • The API surface: shipping.getMethods (active only, first auto-selected),
//     settings.get, wallet.getBalance, coupons.validate, createOrder.
//   • `useExistingAddress` keeps its null-vs-selected shape: null reveals the
//     inline form, an object selects a saved address.
//
// TWO PROMPTS, ONE FILE
//   Prompt 18 owns the SHELL (head, step line, layout, nav row, summary rail,
//   empty state) plus step 0 (Cart) and step 1 (Shipping). Prompt 19 owns the
//   internals of step 2 (Payment) and step 3 (Review) — those render blocks and
//   their stylesheet section are marked below and were deliberately left alone
//   beyond the shared shell atoms (.sectionTitle, .formRow, .formGroup) that
//   reach them for free.
//
// THEMING
//   Tokens only — every colour resolves through `--sf-*`, which flips under
//   body.dark, so light and dark are one stylesheet. ThemeContext is consumed
//   for exactly one thing: the `color-scheme` hint that makes native number
//   spinners, selects and scrollbars render for the active theme.
// =============================================================================

const STEPS = ["Cart", "Shipping", "Payment", "Review"];

const PAYMENT_OPTIONS = [
  { id: "card", label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, RuPay" },
  { id: "upi", label: "UPI", icon: "📱", desc: "Google Pay, PhonePe, Paytm" },
  { id: "net_banking", label: "Net Banking", icon: "🏦", desc: "All major banks supported" },
  { id: "wallet", label: "Wallet", icon: "👛", desc: "Paytm, PhonePe, Amazon Pay" },
  { id: "cod", label: "Cash on Delivery", icon: "💵", desc: "Pay when you receive" },
];

// framer-motion needs JS values, so the Prompt 01 motion token is mirrored
// here: EASE is --sf-ease. Keep in sync with storefront-tokens.css.
const EASE = [0.22, 1, 0.36, 1];

// Discount for an applied coupon at the current subtotal. Derived (never
// stored), so qty changes can't leave a stale amount and re-applying a coupon
// can't stack. `capped` flags when maxDiscount limited the raw value.
const couponDiscountFor = (coupon, amount) => {
  if (!coupon) return { discount: 0, capped: false };
  const raw =
    coupon.type === "percentage"
      ? Math.round((amount * coupon.value) / 100)
      : coupon.value;
  const cap = coupon.maxDiscount || Infinity;
  return { discount: Math.max(0, Math.min(raw, cap, amount)), capped: raw > cap };
};

/* Joins the ids a control is described by, dropping the ones that aren't
   rendered. Returns undefined (not "") so React omits the attribute. */
const describedBy = (...ids) => ids.filter(Boolean).join(" ") || undefined;

// The method's own ETA, in the store's words. Renders nothing when the admin
// left the field empty — never a guessed window.
const etaFor = (method) => {
  const days = method?.estimatedDays;
  if (days == null || days === "") return null;
  return String(days) === "0" ? "Same day" : `${days} business days`;
};

// ---------------------------------------------------------------------------
// Marks — hairline line art in the house drawing style
// ---------------------------------------------------------------------------
const CheckMark = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="4 12.5 9.5 18.5 20 6" />
  </svg>
);

const MinusMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PlusMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const BackMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10 6 4 12 10 18" />
  </svg>
);

const ChevronMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9.5 12 15.5 18 9.5" />
  </svg>
);

// Empty state — the counter with nothing on it: a hairline tray, the loom's
// gold weft laid across it and the shuttle resting. The same drawing language
// as the Wishlist and Products empty states, coloured through the local
// --empty-* aliases so it inverts with the page.
const QuietCartIllustration = () => (
  <svg className={styles.stateArt} width="188" height="132" viewBox="0 0 188 132" fill="none" aria-hidden="true">
    <path
      d="M46 50 H142 L133 100 A5 5 0 0 1 128 104 H60 A5 5 0 0 1 55 100 Z"
      stroke="var(--empty-line)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path d="M74 50 L86 24" stroke="var(--empty-line)" strokeWidth="1" strokeLinecap="round" />
    <path d="M114 50 L102 24" stroke="var(--empty-line)" strokeWidth="1" strokeLinecap="round" />
    <path
      d="M18 116 C 46 108 70 124 96 116 S 140 108 156 118"
      stroke="var(--empty-gold)"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <path
      d="M140 124 L156 118 L172 124 L156 130 Z"
      stroke="var(--empty-gold)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
);

const Checkout = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { cartItems, getCartTotal, getCartItemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { createOrder } = useOrder();

  const [step, setStep] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingError, setShippingError] = useState("");
  const [storeSettings, setStoreSettings] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  // Mobile only: the summary rail is a collapsible band above the CTA. On
  // desktop the stylesheet hides the toggle and shows the body unconditionally,
  // so this flag never reaches the two-column layout.
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Store-credit wallet
  const [walletBalance, setWalletBalance] = useState(0);
  const [applyStoreCredit, setApplyStoreCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0); // amount the customer chose to apply

  const [shippingAddress, setShippingAddress] = useState({
    firstName: user?.firstName || "", lastName: user?.lastName || "",
    phone: user?.phone || "", addressLine1: "", addressLine2: "",
    city: "", state: "", postalCode: "", country: "India",
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [useExistingAddress, setUseExistingAddress] = useState(null);

  useEffect(() => {
    const loadShipping = async () => {
      try {
        // Storefront endpoint (active methods only) — never the admin-scoped
        // method, which needs an admin token on the Laravel branch.
        const methods = await apiService.shipping.getMethods();
        const active = methods.filter((m) => m.isActive !== false);
        setShippingMethods(active);
        if (active.length > 0) setSelectedShipping(active[0]);
      } catch (e) { console.error("Load shipping methods error:", e); }
    };
    const loadSettings = async () => {
      try {
        const settings = await apiService.settings.get();
        setStoreSettings(settings);
      } catch (e) { console.error("Load store settings error:", e); }
    };
    loadShipping();
    loadSettings();
  }, []);

  // Load the signed-in customer's store-credit balance so it can be applied here.
  useEffect(() => {
    if (!user?.id) { setWalletBalance(0); return; }
    let active = true;
    (async () => {
      try {
        const balance = await apiService.wallet.getBalance(user.id);
        if (active) setWalletBalance(Number(balance) || 0);
      } catch (e) { console.error("Load wallet balance error:", e); }
    })();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
        phone: prev.phone || user.phone || "",
      }));
      if (user.addresses?.length > 0) {
        const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
        setUseExistingAddress(defaultAddr);
      }
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // ── Order math ────────────────────────────────────────────────────────────
  // total = subtotal − discount + shipping + tax, with tax on the discounted
  // subtotal. The same rounded figures are stored on the order so Confirmation,
  // Order History and Admin all display exactly what was charged.
  const subtotal = getCartTotal();
  const { discount: couponDiscount, capped: couponCapped } = couponDiscountFor(couponApplied, subtotal);
  const shippingCost = selectedShipping
    ? selectedShipping.rateType === "free" || (selectedShipping.freeAbove && subtotal >= selectedShipping.freeAbove) ? 0 : selectedShipping.flatRate
    : 0;
  const taxRatePct = storeSettings?.store?.taxRate ?? 5;
  const taxAmount = Math.round(Math.max(0, subtotal - couponDiscount) * (taxRatePct / 100));
  const total = subtotal - couponDiscount + shippingCost + taxAmount;

  // Store credit is applied LAST, against the grand total (it behaves like a
  // prepaid gift card — after discounts, shipping and tax). The customer can
  // apply up to their balance, capped by the order total; the remainder, if
  // any, is collected via the chosen payment method. (See PR notes.)
  const maxApplicableCredit = Math.min(walletBalance, total);
  const storeCreditApplied = applyStoreCredit
    ? Math.min(Math.max(0, Math.round(creditAmount)), maxApplicableCredit)
    : 0;
  const amountPayable = Math.max(0, total - storeCreditApplied);
  const fullyCovered = storeCreditApplied > 0 && amountPayable === 0;

  // COD availability comes from store settings, bounded by the amount actually
  // collected on delivery (the payable remainder after store credit).
  const paymentCfg = storeSettings?.payment;
  const codEnabled = paymentCfg?.codEnabled !== false;
  const codMinOrder = paymentCfg?.codMinOrder ?? 0;
  const codMaxOrder = paymentCfg?.codMaxOrder ?? null;
  const codAvailable = codEnabled && amountPayable > 0 &&
    amountPayable >= codMinOrder && (codMaxOrder == null || amountPayable <= codMaxOrder);

  // If totals shift (qty/coupon/shipping) and COD falls out of range, move the
  // selection back to card rather than letting an invalid method be submitted.
  useEffect(() => {
    if (paymentMethod === "cod" && !codAvailable) setPaymentMethod("card");
  }, [paymentMethod, codAvailable]);

  // Keep the chosen credit amount within the current applicable maximum — e.g.
  // when the cart total drops after removing an item or a coupon — so the input
  // never displays (or submits) more than can actually be applied.
  useEffect(() => {
    if (applyStoreCredit && creditAmount > maxApplicableCredit) {
      setCreditAmount(maxApplicableCredit);
    }
  }, [applyStoreCredit, creditAmount, maxApplicableCredit]);

  // A coupon only stays applied while the cart still meets its minimum.
  useEffect(() => {
    if (couponApplied && subtotal < (couponApplied.minOrderAmount || 0)) {
      setCouponApplied(null);
      setCouponCode("");
      setCouponError(
        `${couponApplied.code} was removed — it needs a minimum order of ${formatCurrency(couponApplied.minOrderAmount)}.`
      );
    }
  }, [subtotal, couponApplied]);

  const applyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) { setCouponError("Enter a coupon code"); return; }
    try {
      const coupon = await apiService.coupons.validate(couponCode.trim(), subtotal);
      setCouponApplied(coupon);
    } catch (e) {
      setCouponError(e.message || "Invalid coupon");
      setCouponApplied(null);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponApplied(null);
    setCouponError("");
  };

  const validateAddress = () => {
    const addr = useExistingAddress || shippingAddress;
    const errs = {};
    if (!addr.firstName?.trim()) errs.firstName = "Required";
    if (!addr.lastName?.trim()) errs.lastName = "Required";
    if (!addr.phone?.trim()) errs.phone = "Required";
    if (!addr.addressLine1?.trim()) errs.addressLine1 = "Required";
    if (!addr.city?.trim()) errs.city = "Required";
    if (!addr.state?.trim()) errs.state = "Required";
    if (!addr.postalCode?.trim()) errs.postalCode = "Required";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0) {
      if (cartItems.length === 0) return;
      if (!isAuthenticated) { openAuthModal("login"); return; }
      setStep(1);
    } else if (step === 1) {
      if (!validateAddress()) return;
      if (!selectedShipping) { setShippingError("Please select a shipping method."); return; }
      setShippingError("");
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      placeOrder();
    }
  };

  const placeOrder = async () => {
    setIsProcessing(true);
    try {
      const addr = useExistingAddress || shippingAddress;
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.productId, variantId: item.variantId,
          name: `${item.name}${item.variantName ? ` - ${item.variantName}` : ""}`,
          image: item.image, sku: item.sku || "", price: item.price,
          quantity: item.quantity, subtotal: item.price * item.quantity,
        })),
        shippingAddress: addr,
        billingAddress: addr,
        subtotal,
        discountAmount: couponDiscount,
        couponCode: couponApplied?.code || null,
        shippingAmount: shippingCost,
        taxAmount,
        total,
        // Store credit applied at checkout, and what's left for the gateway.
        storeCreditUsed: storeCreditApplied,
        amountPayable,
        // A fully store-credit order needs no further payment, so it is "paid"
        // via store credit; otherwise the chosen method settles the remainder.
        paymentMethod: fullyCovered ? "store_credit" : paymentMethod,
        paymentStatus: fullyCovered ? "paid" : paymentMethod === "cod" ? "pending" : "paid",
        fulfillmentStatus: "unfulfilled",
        shippingStatus: "pending",
        trackingNumber: null,
        notes: "",
      };

      const result = await createOrder(orderData);
      if (result.success) {
        setOrderPlaced(result.order);
        clearCart({ silent: true });
        const orderNum = result.order.orderNumber || result.order.id;
        navigate(`/order-confirmation/${orderNum}`);
      }
    } catch (e) {
      console.error("Order error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (addressErrors[name]) setAddressErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPTY STATE — the counter with nothing on it
  // ═══════════════════════════════════════════════════════════════════════════
  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>Checkout</p>
            <h1 className={styles.title}>Your cart is quiet</h1>
          </header>
          <div className={styles.state}>
            <QuietCartIllustration />
            <p className={styles.stateText}>
              Nothing has been set aside for this order yet. Choose a weave and it
              waits here — the colour, the length and the price, held until you are
              ready.
            </p>
            <Link to="/products" className={`sf-btn sf-btn--emerald ${styles.stateBtn}`}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reviewAddress = useExistingAddress || shippingAddress;
  const selectedPaymentOption = PAYMENT_OPTIONS.find((pm) => pm.id === paymentMethod);
  const itemCount = getCartItemCount();

  // Soft fade + slide between steps; reduced motion swaps instantly.
  const stepMotion = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.34, ease: EASE },
      };

  // The assurance line under the rail. Store-attested facts ONLY — the returns
  // window from STOREFRONT_CONFIG, COD from the live payment settings, the
  // store's own care address. Nothing here implies live demand or urgency, and
  // a fact whose source is empty simply doesn't appear.
  const assurances = [
    STOREFRONT_CONFIG.returnsWindowDays > 0
      ? `${STOREFRONT_CONFIG.returnsWindowDays}-day returns`
      : null,
    codEnabled ? "Cash on delivery available" : null,
    storeSettings?.store?.email ? `Questions? ${storeSettings.store.email}` : null,
  ].filter(Boolean);

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        {/* ═══════════════════════════════════════════════════════════════════
            SHELL — head, step line, layout, nav row, summary rail (Prompt 18)
            ═══════════════════════════════════════════════════════════════ */}
        <header className={styles.head}>
          <p className={styles.eyebrow}>
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className={styles.title}>Checkout</h1>
        </header>

        {/* The step line: four tracked labels joined by hairlines. Gold and a
            check behind you, ink where you stand, a hairline ahead. */}
        <nav className={styles.stepline} aria-label="Checkout progress">
          <ol className={styles.steplineList}>
            {STEPS.map((s, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li
                  key={s}
                  className={`${styles.stepItem} ${done ? styles.stepDone : ""} ${current ? styles.stepCurrent : ""}`}
                  aria-current={current ? "step" : undefined}
                >
                  <span className={styles.stepMark} aria-hidden="true">
                    {done && <CheckMark />}
                  </span>
                  <span className={styles.stepName}>{s}</span>
                  <span className={styles.srOnly}>
                    {done ? " — completed" : current ? " — current step" : " — not started"}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className={styles.layout}>
          {/* ── The content column ─────────────────────────────────────── */}
          <div className={styles.steps}>
            <AnimatePresence mode="wait">
              {/* ═════════════════════════════════════════════════════════════
                  STEP 0 — CART REVIEW (Prompt 18)
                  ═════════════════════════════════════════════════════════ */}
              {step === 0 && (
                <motion.div key="cart" {...stepMotion}>
                  <h2 className={styles.sectionTitle}>Your selection</h2>
                  <p className={styles.sectionNote}>
                    {itemCount} {itemCount === 1 ? "piece" : "pieces"} set aside for this order.
                  </p>

                  <ul className={styles.lines}>
                    {cartItems.map((item) => (
                      <li key={item.id} className={styles.line}>
                        <div className={styles.thumb}>
                          <img
                            src={item.image || PLACEHOLDER_IMG}
                            alt=""
                            loading="lazy"
                            onError={onImageError}
                          />
                        </div>

                        <div className={styles.lineBody}>
                          <h3 className={styles.lineName}>{item.name}</h3>
                          {item.variantName && (
                            <span className={styles.lineVariant}>{item.variantName}</span>
                          )}
                          <p className={styles.linePrice}>{formatCurrency(item.price)}</p>

                          <div className={styles.lineFoot}>
                            <div className={styles.stepper}>
                              <button
                                type="button"
                                className={styles.stepperBtn}
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <MinusMark />
                              </button>
                              <span className={styles.stepperValue} aria-live="polite" aria-atomic="true">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className={styles.stepperBtn}
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <PlusMark />
                              </button>
                            </div>

                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => removeFromCart(item.id)}
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <p className={styles.lineTotal}>
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {/* Promo code — the drawer's underline field, verbatim. */}
                  <div className={styles.promo}>
                    <h3 className={styles.blockTitle}>Promo code</h3>
                    {couponApplied ? (
                      <div className={styles.couponChip}>
                        <span className={styles.couponCode}>{couponApplied.code}</span>
                        <span className={styles.couponValue}>
                          &minus;{formatCurrency(couponDiscount)}
                        </span>
                        <button
                          type="button"
                          className={styles.couponRemove}
                          onClick={removeCoupon}
                          aria-label={`Remove coupon ${couponApplied.code}`}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className={styles.promoField}>
                        <label className={styles.srOnly} htmlFor="checkout-coupon">
                          Coupon code
                        </label>
                        <input
                          id="checkout-coupon"
                          type="text"
                          className={styles.promoInput}
                          placeholder="Enter coupon code"
                          value={couponCode}
                          autoComplete="off"
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                          aria-invalid={couponError ? true : undefined}
                          aria-describedby={describedBy(couponError && "checkout-coupon-msg")}
                        />
                        <button type="button" className={styles.promoApply} onClick={applyCoupon}>
                          Apply
                        </button>
                      </div>
                    )}
                    {couponApplied && couponCapped && (
                      <p className={styles.promoMsg}>
                        Capped at this coupon&rsquo;s maximum discount of{" "}
                        {formatCurrency(couponApplied.maxDiscount)}.
                      </p>
                    )}
                    {couponError && (
                      <p id="checkout-coupon-msg" className={`${styles.promoMsg} ${styles.promoError}`}>
                        {couponError}
                      </p>
                    )}
                  </div>

                  {/* The gate, said kindly. Continue opens the same AuthModal;
                      the cart survives the login and merges into the account. */}
                  {!isAuthenticated && (
                    <div className={styles.gate}>
                      <p className={styles.gateText}>
                        <span className={styles.gateLead}>Sign in to continue.</span>
                        <span className={styles.gateNote}>
                          Your selection stays exactly as it is. Signing in keeps it
                          with your account, alongside your saved addresses and past
                          orders.
                        </span>
                      </p>
                      <button
                        type="button"
                        className={styles.gateBtn}
                        onClick={() => openAuthModal("login")}
                      >
                        Sign In
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  STEP 1 — SHIPPING (Prompt 18)
                  ═════════════════════════════════════════════════════════ */}
              {step === 1 && (
                <motion.div key="shipping" {...stepMotion}>
                  <h2 className={styles.sectionTitle}>Where it travels</h2>
                  <p className={styles.sectionNote}>
                    Delivered across India in insured silk packaging.
                  </p>

                  {user?.addresses?.length > 0 && (
                    <div className={styles.addrBlock}>
                      <h3 className={styles.blockTitle}>Saved addresses</h3>
                      <div className={styles.addrList}>
                        {user.addresses.map((addr, i) => (
                          <label
                            key={addr.id ?? i}
                            className={`${styles.addrCard} ${useExistingAddress?.id === addr.id ? styles.addrCardSelected : ""}`}
                          >
                            <input
                              type="radio"
                              name="savedAddress"
                              className={styles.control}
                              checked={useExistingAddress?.id === addr.id}
                              onChange={() => { setUseExistingAddress(addr); setAddressErrors({}); }}
                            />
                            <span className={`${styles.box} ${styles.boxRound}`} aria-hidden="true" />
                            <span className={styles.addrCopy}>
                              <span className={styles.addrHead}>
                                <span className={styles.addrLabel}>{addr.label || "Address"}</span>
                                {addr.isDefault && (
                                  <span className={styles.addrDefault}>Default</span>
                                )}
                              </span>
                              <span className={styles.addrName}>
                                {addr.firstName} {addr.lastName}
                              </span>
                              <span className={styles.addrLines}>
                                {addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}
                              </span>
                              <span className={styles.addrPhone}>{addr.phone}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={styles.newAddressBtn}
                        onClick={() => setUseExistingAddress(null)}
                        aria-expanded={!useExistingAddress}
                        aria-controls="checkout-address-form"
                      >
                        + Add new address
                      </button>
                    </div>
                  )}

                  {!useExistingAddress && (
                    <div id="checkout-address-form" className={styles.addressForm}>
                      {user?.addresses?.length > 0 && (
                        <h3 className={styles.blockTitle}>New address</h3>
                      )}
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="ship-first">First name *</label>
                          <input
                            id="ship-first"
                            type="text"
                            name="firstName"
                            autoComplete="given-name"
                            value={shippingAddress.firstName}
                            onChange={handleAddressChange}
                            className={addressErrors.firstName ? styles.inputError : ""}
                            aria-invalid={addressErrors.firstName ? true : undefined}
                            aria-describedby={describedBy(addressErrors.firstName && "ship-first-error")}
                          />
                          {addressErrors.firstName && (
                            <span id="ship-first-error" className={styles.fieldError}>{addressErrors.firstName}</span>
                          )}
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="ship-last">Last name *</label>
                          <input
                            id="ship-last"
                            type="text"
                            name="lastName"
                            autoComplete="family-name"
                            value={shippingAddress.lastName}
                            onChange={handleAddressChange}
                            className={addressErrors.lastName ? styles.inputError : ""}
                            aria-invalid={addressErrors.lastName ? true : undefined}
                            aria-describedby={describedBy(addressErrors.lastName && "ship-last-error")}
                          />
                          {addressErrors.lastName && (
                            <span id="ship-last-error" className={styles.fieldError}>{addressErrors.lastName}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="ship-phone">Phone *</label>
                        <input
                          id="ship-phone"
                          type="tel"
                          name="phone"
                          autoComplete="tel"
                          value={shippingAddress.phone}
                          onChange={handleAddressChange}
                          placeholder="+91 9876543210"
                          className={addressErrors.phone ? styles.inputError : ""}
                          aria-invalid={addressErrors.phone ? true : undefined}
                          aria-describedby={describedBy(addressErrors.phone && "ship-phone-error")}
                        />
                        {addressErrors.phone && (
                          <span id="ship-phone-error" className={styles.fieldError}>{addressErrors.phone}</span>
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="ship-line1">Address line 1 *</label>
                        <input
                          id="ship-line1"
                          type="text"
                          name="addressLine1"
                          autoComplete="address-line1"
                          value={shippingAddress.addressLine1}
                          onChange={handleAddressChange}
                          placeholder="House/Flat No., Building, Street"
                          className={addressErrors.addressLine1 ? styles.inputError : ""}
                          aria-invalid={addressErrors.addressLine1 ? true : undefined}
                          aria-describedby={describedBy(addressErrors.addressLine1 && "ship-line1-error")}
                        />
                        {addressErrors.addressLine1 && (
                          <span id="ship-line1-error" className={styles.fieldError}>{addressErrors.addressLine1}</span>
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="ship-line2">Address line 2</label>
                        <input
                          id="ship-line2"
                          type="text"
                          name="addressLine2"
                          autoComplete="address-line2"
                          value={shippingAddress.addressLine2}
                          onChange={handleAddressChange}
                          placeholder="Landmark, Area (optional)"
                        />
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="ship-city">City *</label>
                          <input
                            id="ship-city"
                            type="text"
                            name="city"
                            autoComplete="address-level2"
                            value={shippingAddress.city}
                            onChange={handleAddressChange}
                            className={addressErrors.city ? styles.inputError : ""}
                            aria-invalid={addressErrors.city ? true : undefined}
                            aria-describedby={describedBy(addressErrors.city && "ship-city-error")}
                          />
                          {addressErrors.city && (
                            <span id="ship-city-error" className={styles.fieldError}>{addressErrors.city}</span>
                          )}
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="ship-state">State *</label>
                          <input
                            id="ship-state"
                            type="text"
                            name="state"
                            autoComplete="address-level1"
                            value={shippingAddress.state}
                            onChange={handleAddressChange}
                            className={addressErrors.state ? styles.inputError : ""}
                            aria-invalid={addressErrors.state ? true : undefined}
                            aria-describedby={describedBy(addressErrors.state && "ship-state-error")}
                          />
                          {addressErrors.state && (
                            <span id="ship-state-error" className={styles.fieldError}>{addressErrors.state}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label htmlFor="ship-postal">Postal code *</label>
                          <input
                            id="ship-postal"
                            type="text"
                            name="postalCode"
                            autoComplete="postal-code"
                            inputMode="numeric"
                            value={shippingAddress.postalCode}
                            onChange={handleAddressChange}
                            className={addressErrors.postalCode ? styles.inputError : ""}
                            aria-invalid={addressErrors.postalCode ? true : undefined}
                            aria-describedby={describedBy(addressErrors.postalCode && "ship-postal-error")}
                          />
                          {addressErrors.postalCode && (
                            <span id="ship-postal-error" className={styles.fieldError}>{addressErrors.postalCode}</span>
                          )}
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="ship-country">Country</label>
                          <input
                            id="ship-country"
                            type="text"
                            autoComplete="country-name"
                            value={shippingAddress.country}
                            readOnly
                            className={styles.readOnly}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping method — the store's own methods, rates and ETAs. */}
                  <div className={styles.methodsBlock}>
                    <h3 className={styles.blockTitle}>Shipping method</h3>
                    <div className={styles.methods}>
                      {shippingMethods.map((method) => {
                        const isFree = method.rateType === "free" || (method.freeAbove && subtotal >= method.freeAbove);
                        const eta = etaFor(method);
                        const freeNote =
                          !isFree && Number(method.freeAbove) > 0
                            ? `Complimentary above ${formatCurrency(method.freeAbove)}`
                            : null;
                        return (
                          <label
                            key={method.id}
                            className={`${styles.method} ${selectedShipping?.id === method.id ? styles.methodSelected : ""}`}
                          >
                            <input
                              type="radio"
                              name="shipping"
                              className={styles.control}
                              checked={selectedShipping?.id === method.id}
                              onChange={() => { setSelectedShipping(method); setShippingError(""); }}
                            />
                            <span className={`${styles.box} ${styles.boxRound}`} aria-hidden="true" />
                            <span className={styles.methodCopy}>
                              <span className={styles.methodName}>{method.name}</span>
                              {method.description && (
                                <span className={styles.methodDesc}>{method.description}</span>
                              )}
                              {(eta || freeNote) && (
                                <span className={styles.methodMeta}>
                                  {eta}
                                  {eta && freeNote && <span aria-hidden="true"> &middot; </span>}
                                  {freeNote}
                                </span>
                              )}
                            </span>
                            <span className={`${styles.methodCost} ${isFree ? styles.methodFree : ""}`}>
                              {isFree ? "Complimentary" : formatCurrency(method.flatRate)}
                            </span>
                          </label>
                        );
                      })}
                      {shippingMethods.length === 0 && (
                        <p className={styles.methodsEmpty}>
                          No shipping methods are available right now. Please try again later.
                        </p>
                      )}
                    </div>
                    {shippingError && (
                      <p className={styles.shippingError} role="alert">{shippingError}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  STEP 2 — PAYMENT  ·  PROMPT 19 OWNS THIS BLOCK
                  Left functional and structurally untouched; it inherits only
                  the shared shell atoms (.sectionTitle, .formRow, .formGroup).
                  ═════════════════════════════════════════════════════════ */}
              {step === 2 && (
                <motion.div key="payment" {...stepMotion}>
                  <h2 className={styles.sectionTitle}>Payment Method</h2>

                  {/* Store credit */}
                  {walletBalance > 0 && (
                    <div className={styles.storeCreditSection}>
                      <div className={styles.storeCreditHeader}>
                        <div className={styles.storeCreditInfo}>
                          <span className={styles.storeCreditWalletIcon} aria-hidden>👛</span>
                          <div>
                            <h3>Store Credit</h3>
                            <p className={styles.storeCreditBalance}>
                              Available balance: <strong>{formatCurrency(walletBalance)}</strong>
                            </p>
                          </div>
                        </div>
                        <label className={styles.storeCreditToggle}>
                          <input
                            type="checkbox"
                            checked={applyStoreCredit}
                            onChange={(e) => {
                              const on = e.target.checked;
                              setApplyStoreCredit(on);
                              setCreditAmount(on ? maxApplicableCredit : 0);
                            }}
                          />
                          <span>Apply to this order</span>
                        </label>
                      </div>

                      {applyStoreCredit && (
                        <div className={styles.storeCreditApply}>
                          <div className={styles.storeCreditAmountRow}>
                            <label>Amount to apply</label>
                            <div className={styles.storeCreditInputWrap}>
                              <span className={styles.storeCreditCurrency}>₹</span>
                              <input
                                type="number"
                                min="0"
                                max={maxApplicableCredit}
                                value={creditAmount}
                                onChange={(e) => {
                                  const n = Number(e.target.value);
                                  setCreditAmount(Number.isFinite(n) ? Math.max(0, n) : 0);
                                }}
                              />
                              <button type="button" onClick={() => setCreditAmount(maxApplicableCredit)}>
                                Use Max
                              </button>
                            </div>
                          </div>
                          <div className={styles.storeCreditSummaryRow}>
                            <span>Store credit applied</span>
                            <span className={styles.storeCreditApplied}>-{formatCurrency(storeCreditApplied)}</span>
                          </div>
                          <div className={styles.storeCreditSummaryRow}>
                            <span>Remaining to pay</span>
                            <span className={styles.storeCreditPayable}>{formatCurrency(amountPayable)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {fullyCovered && (
                    <div className={styles.fullyCoveredNote}>
                      <span aria-hidden>✓</span> Your store credit covers this order in full — no further payment needed.
                    </div>
                  )}

                  {!fullyCovered && (<>
                  <div className={styles.paymentMethods}>
                    {PAYMENT_OPTIONS.map((pm) => {
                      const isCod = pm.id === "cod";
                      const isDisabled = isCod && !codAvailable;
                      const codHint = !codEnabled
                        ? "Currently unavailable"
                        : `Available for orders ${codMinOrder > 0 ? `from ${formatCurrency(codMinOrder)} ` : ""}up to ${formatCurrency(codMaxOrder ?? 0)}`;
                      return (
                        <label key={pm.id} className={`${styles.paymentOption} ${paymentMethod === pm.id ? styles.selectedPayment : ""} ${isDisabled ? styles.disabledPayment : ""}`}>
                          <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} disabled={isDisabled} onChange={() => setPaymentMethod(pm.id)} />
                          <span className={styles.paymentIcon}>{pm.icon}</span>
                          <div>
                            <strong>{pm.label}</strong>
                            <p>{isDisabled ? codHint : pm.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {paymentMethod === "card" && (
                    <div className={styles.cardForm}>
                      <div className={styles.formGroup}>
                        <label>Card Number</label>
                        <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} />
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}><label>Expiry</label><input type="text" placeholder="MM/YY" maxLength={5} /></div>
                        <div className={styles.formGroup}><label>CVV</label><input type="password" placeholder="***" maxLength={4} /></div>
                      </div>
                      <div className={styles.formGroup}><label>Name on Card</label><input type="text" placeholder="Full name" /></div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className={styles.upiForm}>
                      <div className={styles.formGroup}><label>UPI ID</label><input type="text" placeholder="name@upi" /></div>
                    </div>
                  )}

                  {paymentMethod === "net_banking" && (
                    <div className={styles.bankForm}>
                      <div className={styles.formGroup}>
                        <label>Select Bank</label>
                        <select>
                          <option>State Bank of India</option>
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>Axis Bank</option>
                          <option>Kotak Mahindra Bank</option>
                          <option>Punjab National Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "cod" && (
                    <div className={styles.codInfo}>
                      <p>
                        &#9432; Pay with cash when your order is delivered. Available for orders
                        {codMinOrder > 0 ? ` from ${formatCurrency(codMinOrder)}` : ""}
                        {codMaxOrder != null ? ` up to ${formatCurrency(codMaxOrder)}` : ""}.
                      </p>
                    </div>
                  )}
                  </>)}
                </motion.div>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  STEP 3 — REVIEW & CONFIRM  ·  PROMPT 19 OWNS THIS BLOCK
                  ═════════════════════════════════════════════════════════ */}
              {step === 3 && (
                <motion.div key="review" {...stepMotion}>
                  <h2 className={styles.sectionTitle}>Review &amp; Confirm</h2>

                  <div className={styles.reviewItems}>
                    {cartItems.map((item) => (
                      <div key={item.id} className={styles.reviewItem}>
                        <img src={item.image || PLACEHOLDER_IMG} alt={item.name} onError={onImageError} className={styles.reviewItemImage} />
                        <div className={styles.reviewItemInfo}>
                          <h4>{item.name}</h4>
                          {item.variantName && <p className={styles.variant}>{item.variantName}</p>}
                          <p className={styles.reviewItemQty}>Qty: {item.quantity} &times; {formatCurrency(item.price)}</p>
                        </div>
                        <div className={styles.itemSubtotal}>{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewBlock}>
                      <div className={styles.reviewBlockHeader}>
                        <h3>Deliver To</h3>
                        <button type="button" onClick={() => setStep(1)}>Edit</button>
                      </div>
                      <p className={styles.reviewName}>{reviewAddress.firstName} {reviewAddress.lastName}</p>
                      <p>{reviewAddress.addressLine1}{reviewAddress.addressLine2 ? `, ${reviewAddress.addressLine2}` : ""}</p>
                      <p>{reviewAddress.city}, {reviewAddress.state} - {reviewAddress.postalCode}</p>
                      <p>{reviewAddress.country}</p>
                      <p>{reviewAddress.phone}</p>
                    </div>

                    <div className={styles.reviewBlock}>
                      <div className={styles.reviewBlockHeader}>
                        <h3>Shipping Method</h3>
                        <button type="button" onClick={() => setStep(1)}>Edit</button>
                      </div>
                      <p className={styles.reviewName}>{selectedShipping?.name}</p>
                      <p>{selectedShipping?.description}</p>
                      <p className={styles.reviewShippingCost}>{shippingCost === 0 ? "FREE" : formatCurrency(shippingCost)}</p>
                    </div>

                    <div className={styles.reviewBlock}>
                      <div className={styles.reviewBlockHeader}>
                        <h3>Payment</h3>
                        <button type="button" onClick={() => setStep(2)}>Edit</button>
                      </div>
                      {fullyCovered ? (
                        <>
                          <p className={styles.reviewName}>👛 Store Credit</p>
                          <p>Paid in full with store credit ({formatCurrency(storeCreditApplied)}).</p>
                        </>
                      ) : (
                        <>
                          <p className={styles.reviewName}>{selectedPaymentOption?.icon} {selectedPaymentOption?.label}</p>
                          {storeCreditApplied > 0 && (
                            <p>Store credit applied: -{formatCurrency(storeCreditApplied)}</p>
                          )}
                          {paymentMethod === "cod" ? (
                            <p>Pay {formatCurrency(amountPayable)} in cash on delivery.</p>
                          ) : (
                            <p>You will be charged {formatCurrency(amountPayable)}.</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── The summary rail ───────────────────────────────────────────
              Sticky beside the content on desktop; a collapsible band sitting
              directly above the CTA on phones. */}
          <aside className={styles.rail} aria-label="Order summary">
            <div className={styles.railCard}>
              <button
                type="button"
                className={styles.railToggle}
                onClick={() => setSummaryOpen((open) => !open)}
                aria-expanded={summaryOpen}
                aria-controls="checkout-summary-body"
              >
                <span className={styles.railToggleLabel}>Order summary</span>
                <span className={styles.railToggleValue}>
                  {formatCurrency(storeCreditApplied > 0 ? amountPayable : total)}
                </span>
                <span
                  className={`${styles.railChevron} ${summaryOpen ? styles.railChevronOpen : ""}`}
                  aria-hidden="true"
                >
                  <ChevronMark />
                </span>
              </button>

              <h2 className={styles.railTitle}>Order summary</h2>

              <div
                id="checkout-summary-body"
                className={`${styles.railBody} ${summaryOpen ? "" : styles.railBodyCollapsed}`}
              >
                <ul className={styles.railItems}>
                  {cartItems.slice(0, 3).map((item) => (
                    <li key={item.id} className={styles.railItem}>
                      <span className={styles.railItemName}>
                        {item.name}
                        <span className={styles.railItemQty}> &times;{item.quantity}</span>
                      </span>
                      <span className={styles.railItemValue}>
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                {cartItems.length > 3 && (
                  <p className={styles.railMore}>
                    +{cartItems.length - 3} more{" "}
                    {cartItems.length - 3 === 1 ? "piece" : "pieces"}
                  </p>
                )}

                <div className={styles.railRule} />

                <div className={styles.railRow}>
                  <span className={styles.railLabel}>Subtotal</span>
                  <span className={styles.railValue}>{formatCurrency(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className={styles.railRow}>
                    <span className={styles.railLabel}>Discount ({couponApplied.code})</span>
                    <span className={`${styles.railValue} ${styles.railDiscount}`}>
                      &minus;{formatCurrency(couponDiscount)}
                    </span>
                  </div>
                )}
                <div className={styles.railRow}>
                  <span className={styles.railLabel}>Shipping</span>
                  <span className={`${styles.railValue} ${shippingCost === 0 ? styles.railDiscount : ""}`}>
                    {shippingCost === 0 ? "Complimentary" : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className={styles.railRow}>
                  <span className={styles.railLabel}>Tax ({taxRatePct}% GST)</span>
                  <span className={styles.railValue}>{formatCurrency(taxAmount)}</span>
                </div>

                <div className={styles.railRule} />

                <div className={styles.railTotalRow}>
                  <span className={styles.railTotalLabel}>Total</span>
                  <span className={styles.railTotalValue}>{formatCurrency(total)}</span>
                </div>

                {storeCreditApplied > 0 && (
                  <>
                    <div className={styles.railRow}>
                      <span className={styles.railLabel}>Store credit</span>
                      <span className={`${styles.railValue} ${styles.railDiscount}`}>
                        &minus;{formatCurrency(storeCreditApplied)}
                      </span>
                    </div>
                    <div className={styles.railRule} />
                    <div className={styles.railTotalRow}>
                      <span className={styles.railTotalLabel}>Amount payable</span>
                      <span className={styles.railTotalValue}>{formatCurrency(amountPayable)}</span>
                    </div>
                  </>
                )}

                {assurances.length > 0 && (
                  <p className={styles.assurance}>
                    {assurances.map((line, i) => (
                      <React.Fragment key={line}>
                        {i > 0 && <span className={styles.assuranceSep} aria-hidden="true"> · </span>}
                        {line}
                      </React.Fragment>
                    ))}
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* ── The nav row ────────────────────────────────────────────── */}
          <div className={styles.nav}>
            {step > 0 && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(step - 1)}
                disabled={isProcessing}
              >
                <BackMark />
                Back
              </button>
            )}
            <button
              className={styles.primaryBtn}
              onClick={handleNext}
              disabled={isProcessing || cartItems.length === 0}
            >
              {isProcessing
                ? "Processing..."
                : step === 3
                ? fullyCovered
                  ? "Place Order"
                  : `Place Order - ${formatCurrency(amountPayable)}`
                : step === 0 && !isAuthenticated
                ? "Login to Continue"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
