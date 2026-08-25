import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDealsConfig } from "../../context/DealsConfigContext";
import apiService from "../../services/api";
import {
  APP_NAME,
  APP_TAGLINE,
  DEFAULT_CURRENCY,
  FREE_SHIPPING_THRESHOLD,
  POLICY_LAST_UPDATED,
  SOCIAL_LINKS,
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE,
} from "../../utils/constants";
import { isEmailValid } from "../../utils/helpers";
import styles from "./Footer.module.css";

/**
 * Footer — Meghali's Silk editorial close.
 *
 * Four bands on one deep ground, top to bottom:
 *   1. the invitation  — serif "Letters from the loom" + the newsletter row
 *   2. the grid        — white wordmark, brand statement, contact, 4 link columns
 *   3. the promises    — store-attested policy + accepted payment marks
 *   4. the colophon    — copyright and legal links in tiny tracked type
 *
 * The band is deep in BOTH app modes — a dark close is the classic editorial
 * device, and it keeps the page's ivory reading as paper. Its ground is pinned
 * to --sf-color-brand-green-deep, which storefront-tokens.css declares once in
 * :root and never re-declares under body.dark, so dark mode cannot double-darken
 * it into mud. Everything inside paints from footer-scoped aliases (see
 * Footer.module.css) built on mode-agnostic tokens, so legibility is identical
 * in both modes. No hardcoded hex and no hardcoded type in here — the only
 * literal colours are the payment networks' own brand hexes, which are mandated
 * marks and must not be re-skinned.
 *
 * The newsletter contract is untouched: isEmailValid() gate →
 * apiService.leads.createNewsletter(email) → success / error state.
 */

// The footer ground is deep in both modes, so the WHITE wordmark is the only
// correct art here — the gold one would sink into it. Transparent-ground PNG, so
// it sits straight on the band and the old green logo plate is retired. This is
// byte-for-byte the URL SidebarMenu uses for its dark-mode twin, so it usually
// paints from cache. Intrinsic art is 1454x454; the w_520 transform is 520x162,
// ~3.4x the 48px render height, so it stays crisp on retina. width/height are
// passed through to reserve the box and avoid CLS.
const LOGO_SRC =
  "https://res.cloudinary.com/v8vrixwq/image/upload/f_auto,q_auto,w_520/v1787592405/meghali-silk-logo-white.png";
const LOGO_W = 520;
const LOGO_H = 162;

const EMAIL_INPUT_ID = "footer-newsletter-email";
const EMAIL_ERROR_ID = "footer-newsletter-error";

// Same idiom as the AnnouncementBar, from the same constant, so the two figures
// can never drift apart.
const shippingThreshold = `${DEFAULT_CURRENCY.symbol}${FREE_SHIPPING_THRESHOLD.toLocaleString(
  "en-IN"
)}`;

// Store-attested promises only. Every line here is written down elsewhere in the
// storefront — the 7-day window in RefundPolicy and the FAQ, the figure in
// FREE_SHIPPING_THRESHOLD, the fabrics in the catalogue. No ratings, no
// subscriber counts, and no "24/7 support" claim (SUPPORT_HOURS contradicts it).
const TRUST_ITEMS = [
  {
    id: "secure",
    label: "Secure payment",
    path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
  },
  {
    id: "returns",
    label: "7-day returns",
    path: "M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z",
  },
  {
    id: "shipping",
    label: `Free shipping above ${shippingThreshold}`,
    path: "M18 18.5a1.5 1.5 0 001.5-1.5 1.5 1.5 0 00-1.5-1.5 1.5 1.5 0 00-1.5 1.5 1.5 1.5 0 001.5 1.5zM19.5 9.5h-3V12h4.46L19.5 9.5zM6 18.5A1.5 1.5 0 007.5 17 1.5 1.5 0 006 15.5 1.5 1.5 0 004.5 17 1.5 1.5 0 006 18.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3zM3 6v9h.76c.55-.61 1.35-1 2.24-1 .89 0 1.69.39 2.24 1H15V6H3z",
  },
  {
    id: "authentic",
    label: "Authentic Assamese silk",
    path: "M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
  },
];

const Footer = () => {
  const { enabled: dealsEnabled } = useDealsConfig();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState("idle"); // idle | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = email.trim();
    if (!isEmailValid(trimmed)) {
      setSubscribeStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.leads.createNewsletter(trimmed);
      setSubscribeStatus("success");
      setEmail("");
      // The success line replaces the form; reset back to the input after a few
      // seconds so a second visitor on the same screen can subscribe too.
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setSubscribeStatus("idle"), 6000);
    } catch {
      // Surface genuine failures instead of a fake "success". We still don't
      // reveal whether this address was already subscribed — the API returns a
      // uniform response for that — but a network/5xx error must not look like
      // a win, otherwise real failures stay invisible and nothing is recorded.
      setSubscribeStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Every target below resolves to a real route in App.js — no path here hits
  // the catch-all redirect to "/". "Deals" / "Special Offers" share the deals
  // hub and are dropped when the admin disables it; New Arrivals / Best Sellers
  // are sort deep-links the Products page understands (newest / popular).
  const shopLinks = [
    { label: "All Products", path: "/products" },
    { label: "New Arrivals", path: "/products?sort=newest" },
    { label: "Best Sellers", path: "/products?sort=popular" },
    { label: "Deals", path: "/special-offers", deals: true },
  ].filter((link) => dealsEnabled || !link.deals);

  // Company column — Our Story is the About page; Special Offers is deals-gated.
  const companyLinks = [
    { label: "Our Story", path: "/about" },
    { label: "Special Offers", path: "/special-offers", deals: true },
    { label: "Wishlist", path: "/wishlist" },
  ].filter((link) => dealsEnabled || !link.deals);

  // Support column — Help Center covers shipping/FAQ topics; Returns maps to the
  // Refund Policy page. All paths exist in App.js.
  const supportLinks = [
    { label: "Support", path: "/support" },
    { label: "Help Center", path: "/help" },
    { label: "Order Tracking", path: "/orders" },
    { label: "My Account", path: "/profile" },
    { label: "Returns & Exchange", path: "/refund" },
  ];

  // Legal column — exact paths that all resolve in App.js.
  const legalColumnLinks = [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
    { label: "Cookie Policy", path: "/cookies" },
    { label: "Refund Policy", path: "/refund" },
  ];

  // Social links are sourced from constants (SOCIAL_LINKS) so a new store
  // updates them in one place; only entries with a URL are rendered.
  const socialLinks = [
    {
      label: "Facebook",
      url: SOCIAL_LINKS.FACEBOOK,
      path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    },
    {
      label: "Instagram",
      url: SOCIAL_LINKS.INSTAGRAM,
      path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
    },
    {
      label: "YouTube",
      url: SOCIAL_LINKS.YOUTUBE,
      path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    },
    {
      label: "X",
      url: SOCIAL_LINKS.TWITTER,
      path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    },
    {
      label: "WhatsApp",
      url: SOCIAL_LINKS.WHATSAPP,
      path: "M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 01-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.19 8.19 0 01-1.26-4.37c0-4.54 3.69-8.25 8.25-8.25zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.53.07-.25-.13-1.06-.39-2.02-1.24-.75-.66-1.25-1.48-1.4-1.73-.14-.24-.01-.37.11-.5.11-.11.25-.29.37-.44.11-.15.15-.25.23-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.55-.42h-.47z",
    },
  ].filter((s) => s.url);

  const currentYear = new Date().getFullYear();

  const linkColumns = [
    { id: "shop", title: "Shop", links: shopLinks },
    { id: "company", title: "Company", links: companyLinks },
    { id: "support", title: "Support", links: supportLinks },
    { id: "legal", title: "Legal", links: legalColumnLinks },
  ];

  return (
    <footer className={styles.footer}>
      {/* ---------- 1. The invitation ---------- */}
      <div className={styles.invitation}>
        <div className={styles.container}>
          <div className={styles.invitationInner}>
            <div className={styles.invitationCopy}>
              <p className={styles.eyebrow}>Newsletter</p>
              <p className={styles.invitationTitle}>Letters from the loom</p>
              <p className={styles.invitationNote}>
                New arrivals, weave stories and quiet offers — straight to your
                inbox.
              </p>
            </div>

            {subscribeStatus === "success" ? (
              <p className={styles.formSuccess} role="status">
                Thank you — you are on the list.
              </p>
            ) : (
              <form className={styles.form} onSubmit={handleSubscribe} noValidate>
                <label className={styles.srOnly} htmlFor={EMAIL_INPUT_ID}>
                  Email address
                </label>
                <div className={styles.field}>
                  <input
                    id={EMAIL_INPUT_ID}
                    type="email"
                    name="email"
                    autoComplete="email"
                    className={`${styles.input} ${
                      subscribeStatus === "error" ? styles.inputError : ""
                    }`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (subscribeStatus === "error") setSubscribeStatus("idle");
                    }}
                    disabled={isSubmitting}
                    aria-invalid={subscribeStatus === "error"}
                    aria-describedby={
                      subscribeStatus === "error" ? EMAIL_ERROR_ID : undefined
                    }
                  />
                  {/* The shared `.sf-btn` shape, with the footer's own primary
                      skin: `--emerald` is ink-on-ink here in light mode (the
                      CTA fill is the same near-black as this band), so the
                      module inverts it to ivory-on-ink instead. */}
                  <button
                    type="submit"
                    className={`sf-btn ${styles.submitBtn}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending" : "Subscribe"}
                  </button>
                </div>
                {subscribeStatus === "error" && (
                  <p className={styles.formError} id={EMAIL_ERROR_ID} role="alert">
                    {errorMsg}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ---------- 2. The grid ---------- */}
      <div className={styles.main}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.brandCol}>
              <img
                className={styles.logo}
                src={LOGO_SRC}
                alt={APP_NAME}
                width={LOGO_W}
                height={LOGO_H}
                loading="lazy"
                decoding="async"
              />
              <p className={styles.brandLine}>{APP_TAGLINE}</p>
              <p className={styles.brandNote}>
                Muga, Eri and Pat silk, handwoven on the looms of Sualkuchi,
                Assam.
              </p>

              <dl className={styles.contact}>
                <dt className={styles.contactLabel}>Studio</dt>
                <dd className={styles.contactValue}>{SUPPORT_ADDRESS}</dd>
                <dt className={styles.contactLabel}>Write</dt>
                <dd className={styles.contactValue}>
                  <a className={styles.contactLink} href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                </dd>
                <dt className={styles.contactLabel}>Call</dt>
                <dd className={styles.contactValue}>
                  <a
                    className={styles.contactLink}
                    href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
                  >
                    {SUPPORT_PHONE}
                  </a>
                </dd>
                <dt className={styles.contactLabel}>Hours</dt>
                <dd className={styles.contactValue}>{SUPPORT_HOURS}</dd>
              </dl>

              {socialLinks.length > 0 && (
                <div className={styles.social}>
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                      aria-label={social.label}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width="18"
                        height="18"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d={social.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {linkColumns.map((col) => (
              <nav
                className={styles.linkCol}
                key={col.id}
                aria-labelledby={`footer-col-${col.id}`}
              >
                <h2 className={styles.colTitle} id={`footer-col-${col.id}`}>
                  {col.title}
                </h2>
                <ul className={styles.linkList}>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.path} className={styles.footerLink}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- 3. The promises ---------- */}
      <div className={styles.trustBar}>
        <div className={styles.container}>
          <div className={styles.trustInner}>
            <ul className={styles.trustList}>
              {TRUST_ITEMS.map((item) => (
                <li className={styles.trustItem} key={item.id}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="16"
                    height="16"
                    className={styles.trustIcon}
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d={item.path} />
                  </svg>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>

            {/* The payment networks' own brand hexes are mandated marks and are
                the one documented exception to the tokens-only rule — they must
                not be re-skinned. The <text> nodes inherit the storefront font
                from .paymentBadge (see the module), so no font literal remains. */}
            <div className={styles.payments}>
              <span className={styles.paymentLabel}>We accept</span>
              <div className={styles.paymentIcons}>
                <span className={styles.paymentBadge}>
                  <svg viewBox="0 0 48 32" width="40" height="26" role="img" aria-label="Visa">
                    <rect width="48" height="32" rx="4" fill="#1A1F71" />
                    <text x="24" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">VISA</text>
                  </svg>
                </span>
                <span className={styles.paymentBadge}>
                  <svg viewBox="0 0 48 32" width="40" height="26" role="img" aria-label="Mastercard">
                    <rect width="48" height="32" rx="4" fill="#252525" />
                    <circle cx="19" cy="16" r="8" fill="#EB001B" />
                    <circle cx="29" cy="16" r="8" fill="#F79E1B" />
                    <path d="M24 10.34a8 8 0 010 11.32 8 8 0 000-11.32z" fill="#FF5F00" />
                  </svg>
                </span>
                <span className={styles.paymentBadge}>
                  <svg viewBox="0 0 48 32" width="40" height="26" role="img" aria-label="UPI">
                    <rect width="48" height="32" rx="4" fill="#EDEDED" />
                    <text x="24" y="20" textAnchor="middle" fill="#00897B" fontSize="11" fontWeight="bold">UPI</text>
                  </svg>
                </span>
                <span className={styles.paymentBadge}>
                  <svg viewBox="0 0 48 32" width="40" height="26" role="img" aria-label="Cash on delivery">
                    <rect width="48" height="32" rx="4" fill="#4CAF50" />
                    <text x="24" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">COD</text>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 4. The colophon ---------- */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomInner}>
            <p className={styles.copyright}>
              &copy; {currentYear} {APP_NAME}. All rights reserved.
              <span className={styles.policyDate}>
                {" "}
                Policies last updated {POLICY_LAST_UPDATED}.
              </span>
            </p>
            <nav className={styles.legalLinks} aria-label="Legal">
              <Link to="/terms" className={styles.legalLink}>
                Terms of Service
              </Link>
              <Link to="/privacy" className={styles.legalLink}>
                Privacy Policy
              </Link>
              <Link to="/cookies" className={styles.legalLink}>
                Cookie Policy
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
