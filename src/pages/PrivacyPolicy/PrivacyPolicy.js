// =============================================================================
// PRIVACY POLICY  —  Meghali's Silk, route `/privacy`
// =============================================================================
// The first of the four policy pages (/privacy, /terms, /cookies, /refund),
// which share one typeset "document" treatment: a tracked gold kicker, a serif
// title over a hairline, the revision stamp, a standfirst, then numbered
// clauses down a ~70-character measure with their numbers hung out into the
// left gutter. See the stylesheet header for the shared vocabulary.
//
// WHAT THE REBUILD CORRECTED
//   • THE PAGE WAS A STACK OF CARDS. Eight boxed panels on a 920px column, each
//     with its own border and hover lift, is a dashboard pattern — it fights
//     long-form reading. Legal copy wants a measure, hairlines and air.
//   • THE COPY WAS GENERIC E-COMMERCE BOILERPLATE. It is now written for this
//     house: the stitching measurements a made-to-measure blouse needs, the
//     retention period Indian tax law actually imposes, and an explicit
//     statement that card and UPI credentials are entered on the gateway's
//     page and never reach us — which is what the checkout really does.
//   • THE COOKIE CLAUSE WAS AN ORPHAN. It described cookies without pointing at
//     the Cookie Policy that details them; it now links across.
//
// STATIC BY DESIGN
//   No API calls and none needed — the page owns its copy. `APP_NAME`,
//   `SUPPORT_EMAIL`, `SUPPORT_ADDRESS` and `POLICY_LAST_UPDATED` are the only
//   values that come from outside, and `POLICY_LAST_UPDATED` is shared with the
//   other three pages so the four can never disagree about their revision date.
//
// THEMING
//   Tokens only. Every colour resolves through `--sf-*`, which flips under
//   `body.dark`, so light and dark are one stylesheet. ThemeContext is consumed
//   for nothing but the `color-scheme` hint that themes native scrollbars.
// =============================================================================
import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { reveal as sharedReveal } from "../../theme/motion";
import { useTheme } from "../../context/ThemeContext";
import {
  POLICY_LAST_UPDATED,
} from "../../utils/constants";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import styles from "./PrivacyPolicy.module.css";

const PrivacyPolicy = () => {
  // Store name and contact details are whatever the admin last saved in
  // Settings > General, so the policy never names a store that no longer exists.
  const { storeName, email: supportEmail, address: supportAddress, emailHref } = useStoreSettings();
  const { isDarkMode } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // The shared reveal from theme/motion.js: one gentle fade and rise, stepped
  // down the page and capped so the last clause never waits behind a queue.
  // It returns nothing at all under reduced motion, so the clauses paint at
  // their final state on the first frame.
  const reveal = (i) => sharedReveal(prefersReducedMotion, { index: i });

  // Eight clauses, in the order a reader needs them: what we take, why, who
  // else sees it, how it is kept, and how to get it back.
  const sections = [
    {
      title: "What we collect",
      body: [
        `Galleria Producer Company Limited, the company behind ${storeName}, collects the details you give us when you open an account, place an order or write to us: your name, email address, phone number, and your delivery and billing addresses. If you order a blouse stitched to measure, we also hold the measurements you send us for as long as that order is open.`,
        "We record how the site is used — the pages you view, your device and browser, and an approximate location from your IP address — together with the cookies described in our Cookie Policy. Card, UPI and net-banking credentials are entered on our payment provider's own page and never reach our servers.",
      ],
    },
    {
      title: "Why we hold it",
      body: [
        "To take and fulfil your order, arrange delivery, handle returns and refunds, answer your questions, and keep the account and order history you see under My Orders.",
        "We also use it to meet our obligations under Indian tax and consumer law, to detect and prevent fraud, and — only where you have asked for it — to send occasional word of new weaves and offers. You can withdraw that consent at any time without affecting anything else.",
      ],
    },
    {
      title: "Who else sees it",
      body: [
        "Only those who need it to get a parcel to you or money back to you: our courier partners, our payment gateways, the service that sends your order emails, and our accountants and auditors. Each is bound to use your data only for the work we have given them.",
        "We do not sell your personal information and we do not trade it for advertising. We will disclose data where a law, a court or a regulator requires it of us.",
      ],
    },
    {
      title: "How we protect it",
      body: [
        "The site is served over TLS, payment is completed on the gateway's own PCI-DSS-compliant page, and access to customer records is limited to the staff whose work requires it. Full card numbers are never stored by us.",
        "No system is beyond reach. If a breach ever affects your data, we will tell you and the relevant authority without undue delay, and we will tell you what we are doing about it.",
      ],
    },
    {
      title: "Cookies and tracking",
      body: [
        "We use cookies to keep your cart and your session, to remember preferences such as your theme, and to understand how the site is used.",
      ],
      // Rendered after the prose above so the cross-link reads as a closing line.
      trailing: (
        <>
          What each cookie does and how long it lives is set out in our{" "}
          <Link to="/cookies" className={styles.link}>
            Cookie Policy
          </Link>
          . You can clear or block them from your browser at any time, though
          the ones that hold your cart are needed for the site to work.
        </>
      ),
    },
    {
      title: "Your rights",
      body: [
        "You may ask us for a copy of what we hold about you, have anything inaccurate corrected, ask for your data to be deleted, or object to a particular use of it. Write to us and we will respond within thirty days.",
        "Closing your account does not erase the order and invoice records we are required by law to keep; everything not covered by that requirement is removed.",
      ],
    },
    {
      title: "How long we keep it",
      body: [
        "Your account and the data attached to it stay with us for as long as the account is open. Order, invoice and tax records are kept for the period Indian tax and company law requires — currently eight financial years — even after an account is closed.",
        "Analytics data is retained in aggregate and is not tied back to you.",
      ],
    },
    {
      title: "Changes to this policy",
      body: [
        "If this policy changes, the revised version is posted here and the date at the head of the page moves with it. Where a change materially affects how we use your data, we will tell you by email before it takes effect.",
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
              Privacy Policy
            </span>
          </nav>

          {/* ── Masthead ─────────────────────────────────────────────────── */}
          <motion.div {...reveal(0)}>
            <p className={styles.kicker}>Policies</p>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.updated}>
              Last updated: {POLICY_LAST_UPDATED}
            </p>
            <p className={styles.standfirst}>
              {storeName} is a small house selling handwoven Assamese silk. This
              policy sets out what we collect when you shop with us, why we hold
              it, and how to have it corrected or removed.
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
                {section.trailing && (
                  <p className={styles.prose}>{section.trailing}</p>
                )}
              </motion.section>
            ))}
          </div>

          {/* ── Colophon ─────────────────────────────────────────────────── */}
          <div className={styles.colophon}>
            <p className={styles.colophonLabel}>Privacy questions</p>
            <p className={styles.colophonText}>
              Write to{" "}
              <a href={emailHref} className={styles.link}>
                {supportEmail}
              </a>{" "}
              and mark your message for the privacy desk.
            </p>
            <p className={styles.colophonText}>{supportAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
