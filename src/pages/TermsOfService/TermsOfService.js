// =============================================================================
// TERMS OF SERVICE  —  Meghali's Silk, route `/terms`
// =============================================================================
// One of the four policy pages (/privacy, /terms, /cookies, /refund) that share
// a single typeset "document" treatment: a tracked gold kicker, a serif title
// over a hairline, the revision stamp, a standfirst, then numbered clauses down
// a ~70-character measure with their numbers hung out into the left gutter. See
// the stylesheet header for the shared vocabulary.
//
// WHAT THE REBUILD CORRECTED
//   • THE TAX CLAUSE WAS WRONG, AND THEN IT WAS FROZEN. It read "prices … are
//     inclusive of applicable GST" while the checkout did the opposite. It now
//     WRITES ITSELF from `settings.store` — currency, symbol, taxRate and
//     taxIncluded — so changing any of them in Settings > General re-words the
//     clause instead of leaving a false one on the page.
//   • THE SHIPPING CLAUSE WAS ONE LONG SENTENCE. The rates and windows are the
//     part a reader comes for, so the three live methods in `shipping_methods`
//     — ₹99 free above ₹999, ₹199 free above ₹4,999, ₹499 same-day in Kolkata —
//     are now a hairline definitions list instead of prose.
//   • THE PAYMENT CLAUSE OMITTED THE COD CEILING. It now states the live
//     `settings.payment` ceiling, and drops the sentence entirely when the
//     admin turns cash on delivery off.
//   • THE RETURN WINDOW IS NO LONGER A LITERAL. It interpolates
//     `STOREFRONT_CONFIG.returnsWindowDays`, the same value the buy-box badge
//     and the Refund Policy read, so the three can never drift apart.
//
// STATIC BY DESIGN
//   No API calls of its own — the store's name, contact details, currency, tax
//   treatment and COD rules arrive through StoreSettingsContext.
//   `POLICY_LAST_UPDATED` is shared with the other three policy pages so they
//   can never disagree about their date.
//
// THEMING
//   Tokens only; ThemeContext is consumed for nothing but the `color-scheme`
//   hint that themes native scrollbars.
// =============================================================================
import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { reveal as sharedReveal } from "../../theme/motion";
import { useTheme } from "../../context/ThemeContext";
import { STOREFRONT_CONFIG } from "../../theme/tokens";
import {
  POLICY_LAST_UPDATED,
} from "../../utils/constants";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import { SUPPORTED_CURRENCIES } from "../../utils/storeSettings";
import { formatCurrency } from "../../utils/helpers";
import styles from "./TermsOfService.module.css";

const RETURN_DAYS = STOREFRONT_CONFIG.returnsWindowDays;

const TermsOfService = () => {
  // Store name and contact details are whatever the admin last saved in
  // Settings > General, so the policy never names a store that no longer exists.
  const {
    storeName,
    email: supportEmail,
    address: supportAddress,
    emailHref,
    currency,
    currencySymbol,
    taxRate,
    taxIncluded,
    payment,
  } = useStoreSettings();

  // The pricing and payment clauses have to state what the checkout actually
  // does, so they are written from the live settings rather than typed out.
  const currencyName =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.label.replace(
      / *([^)]*)$/,
      ""
    ) || currency;
  const codClause = !payment.codEnabled
    ? "Cash on delivery is not currently offered."
    : payment.codMaxOrder
    ? `Cash on delivery is available on orders up to ${formatCurrency(
        payment.codMaxOrder,
        null,
        { decimals: 0 }
      )} and may be withheld for addresses with a history of refused deliveries.`
    : "Cash on delivery is available and may be withheld for addresses with a history of refused deliveries.";
  const { isDarkMode } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // The shared reveal from theme/motion.js: one gentle fade and rise, stepped
  // down the page and capped. It returns nothing at all under reduced motion,
  // so the clauses paint at their final state on the first frame.
  const reveal = (i) => sharedReveal(prefersReducedMotion, { index: i });

  const sections = [
    {
      title: "Accepting these terms",
      body: [
        `By browsing or buying from ${storeName}, operated by Galleria Producer Company Limited of Kolkata, West Bengal, you agree to the terms set out below. If you do not agree with them, please do not use the site.`,
        "We may revise these terms from time to time. The version published here at the moment you place an order is the one that governs it.",
      ],
    },
    {
      title: "Your account",
      body: [
        "You must be at least eighteen years old to buy from us. Give accurate details when you register, keep them current, and keep your password to yourself — anything done through your account is treated as done by you.",
        "Tell us promptly if you believe someone else has your credentials. We may suspend or close an account used for fraud, resale misrepresentation, or abuse of our staff.",
      ],
    },
    {
      title: "Orders and pricing",
      body: [
        `All prices are shown in ${currencyName} (${currencySymbol}) and are ${
          taxIncluded ? "inclusive of" : "exclusive of"
        } tax at ${taxRate}%. ${
          taxIncluded
            ? "The tax already inside the price is broken out on the order summary and on your invoice."
            : "Tax is calculated at checkout and appears as its own line on the order summary and on your invoice."
        }`,
        "Prices, offers and coupon terms may change without notice, but never after you have placed an order. Every piece is handwoven and held in small numbers, so an order is an offer to buy that we accept when we confirm it — if a piece has sold in the meantime we will tell you and refund you in full.",
        "Handloom silk varies. Slight irregularities in the weave, and small differences between the colour on your screen and the colour in your hands, are characteristics of the cloth rather than faults.",
      ],
    },
    {
      title: "Payment",
      body: [
        "We accept credit and debit cards, UPI, net banking, wallets, and cash on delivery. Cards and UPI are handled by PCI-DSS-compliant gateways on their own pages; we never see or store your full card number.",
        `${codClause} Store credit behaves like a prepaid gift card: it is applied last, against the grand total after discounts, shipping and tax, and anything still outstanding is collected by your chosen method.`,
      ],
    },
    {
      title: "Shipping and delivery",
      body: [
        "Every piece is dispatched from Kolkata in insured packaging. The methods available to you are shown at checkout and depend on your pin code:",
      ],
      defs: [
        {
          term: "Standard",
          text: "₹99, and free on orders above ₹999. Five to seven business days.",
        },
        {
          term: "Express",
          text: "₹199, and free on orders above ₹4,999. Two to three business days.",
        },
        {
          term: "Same day",
          text: "₹499, within select Kolkata pin codes, on pieces already in stock.",
        },
      ],
      trailing:
        "Delivery times are estimates. We are not responsible for delays caused by carriers, weather, strikes or other circumstances outside our control, though we will keep you informed and help you chase a parcel that has gone quiet.",
    },
    {
      title: "Returns and refunds",
      body: [
        `Eligible pieces may be returned within ${RETURN_DAYS} days of delivery. Refunds go back to the method you paid with once the piece has reached us and passed inspection.`,
      ],
      trailing: (
        <>
          What qualifies, what does not, and how long each payment method takes
          are set out in full in our{" "}
          <Link to="/refund" className={styles.link}>
            Return &amp; Refund Policy
          </Link>
          , which forms part of these terms.
        </>
      ),
    },
    {
      title: "Intellectual property",
      body: [
        `Everything published on ${storeName} — the photographs, the written descriptions, the wordmark and the site itself — belongs to Galleria Producer Company Limited or is used by us under licence. You may not copy, republish or make derivative works from it without our written permission.`,
        "Traditional Assamese motifs are the shared inheritance of the weaving communities of Assam; nothing here claims ownership of them. Our claim is to our own photographs, text and design.",
      ],
    },
    {
      title: "Limitation of liability",
      body: [
        "The site is provided as it stands. We do not warrant that it will be uninterrupted or error-free, and we are not liable for indirect, incidental or consequential loss arising from your use of it.",
        "Nothing in these terms limits any right you have under the Consumer Protection Act, 2019, or any other liability that cannot lawfully be excluded. Where liability can be limited, ours is limited to the amount you paid for the order in question.",
      ],
    },
    {
      title: "Governing law",
      body: [
        "These terms are governed by the laws of India. Any dispute arising from them is subject to the exclusive jurisdiction of the courts of Kolkata, West Bengal.",
        "Before it comes to that, please write to us — most things are settled in a single email.",
      ],
    },
  ];

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        <div className={styles.doc}>
          {/* ── Breadcrumb ───────────────────────────────────────────────── */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span className={styles.breadcrumbSep} aria-hidden="true">
              /
            </span>
            <span className={styles.breadcrumbCurrent} aria-current="page">
              Terms of Service
            </span>
          </nav>

          {/* ── Masthead ─────────────────────────────────────────────────── */}
          <motion.div {...reveal(0)}>
            <p className={styles.kicker}>Policies</p>
            <h1 className={styles.title}>Terms of Service</h1>
            <p className={styles.updated}>
              Last updated: {POLICY_LAST_UPDATED}
            </p>
            <p className={styles.standfirst}>
              The agreement between you and {storeName} when you shop with us —
              what we undertake to do, what we ask of you, and where each of us
              stands if something goes wrong.
            </p>
          </motion.div>

          {/* ── The clauses ──────────────────────────────────────────────── */}
          <div className={styles.sections}>
            {sections.map((section, i) => (
              <motion.section
                key={section.title}
                className={styles.section}
                {...reveal(i + 1)}
              >
                <span className={styles.sectionNum} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className={styles.prose}>
                    {paragraph}
                  </p>
                ))}

                {/* The shipping methods read better as rows than as a sentence. */}
                {section.defs && (
                  <dl className={styles.defs}>
                    {section.defs.map((def) => (
                      <div key={def.term} className={styles.defRow}>
                        <dt className={styles.defTerm}>{def.term}</dt>
                        <dd className={styles.defText}>{def.text}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {section.trailing && (
                  <p className={styles.prose}>{section.trailing}</p>
                )}
              </motion.section>
            ))}
          </div>

          {/* ── Colophon ─────────────────────────────────────────────────── */}
          <div className={styles.colophon}>
            <p className={styles.colophonLabel}>Questions about these terms</p>
            <p className={styles.colophonText}>
              Write to{" "}
              <a href={emailHref} className={styles.link}>
                {supportEmail}
              </a>
              , or read the{" "}
              <Link to="/privacy" className={styles.link}>
                Privacy Policy
              </Link>{" "}
              for how we handle your data.
            </p>
            <p className={styles.colophonText}>{supportAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
