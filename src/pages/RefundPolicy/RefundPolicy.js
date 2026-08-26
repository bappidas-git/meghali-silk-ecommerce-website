// =============================================================================
// RETURN & REFUND POLICY  —  Meghali's Silk, route `/refund`
// =============================================================================
// The last of the four policy pages (/privacy, /terms, /cookies, /refund) that
// share one typeset "document" treatment: a tracked gold kicker, a serif title
// over a hairline, the revision stamp, a standfirst, then numbered clauses down
// a ~70-character measure with their numbers hung out into the left gutter.
// This one carries the most furniture — the window banner, the four steps, the
// two lists and the timeline table — and every piece of it is hairline work.
// See the stylesheet header for the shared vocabulary.
//
// WHAT THE REBUILD CORRECTED
//   • STEP ONE DESCRIBED A FLOW THAT DOES NOT EXIST. It said to "click
//     Return/Exchange" as though that opened a returns wizard. What the button
//     on /orders actually does — see `isReturnEligible` and its onClick in
//     OrderHistory.js — is appear on delivered orders inside the window and
//     navigate to /support. The step now says so.
//   • THE WINDOW WAS A LITERAL IN SIX PLACES. It is interpolated from
//     `STOREFRONT_CONFIG.returnsWindowDays` — the same 7 that drives the
//     buy-box badge, the Delivery & Returns panel, the checkout reassurance
//     line and OrderHistory's eligibility test — so none of them can drift.
//   • THE CONDITIONS SAID NOTHING ABOUT SILK. A returns policy for handwoven
//     cloth has to distinguish a weaving irregularity (which is the handloom,
//     and not a fault) from a genuine flaw (which is), and has to be plain that
//     a worn, washed or perfumed piece cannot go back on the shelf. It is now.
//   • THE TIMELINE TABLE HAD NO HEADER. Five <div> rows of two spans, so
//     nothing said which column was the method and which the wait. It is a real
//     table now, with the payment method as a row header.
//
// STATIC BY DESIGN
//   No API calls and none needed. `POLICY_LAST_UPDATED` is shared with the
//   other three policy pages so they can never disagree about their date.
//
// THEMING
//   Tokens only; ThemeContext is consumed for nothing but the `color-scheme`
//   hint that themes native scrollbars, the table's included.
// =============================================================================
import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { STOREFRONT_CONFIG } from "../../theme/tokens";
import {
  SUPPORT_EMAIL,
  POLICY_LAST_UPDATED,
} from "../../utils/constants";
import styles from "./RefundPolicy.module.css";

// The one number this page turns on. Shared with the buy box, the checkout and
// OrderHistory's eligibility test.
const RETURN_DAYS = STOREFRONT_CONFIG.returnsWindowDays;

const STEPS = [
  {
    title: "Tell us",
    text: `Open My Orders, find the delivered order and press Return / Exchange — it appears for ${RETURN_DAYS} days after delivery and takes you through to our care desk. Tell us which piece is going back and why.`,
  },
  {
    title: "Pack it",
    text: "Fold the piece back into the packaging it arrived in, with the tags still attached and the invoice inside. Our pickup partner collects from your address at no cost to you.",
  },
  {
    title: "We look it over",
    text: "The piece is checked within two business days of reaching Kolkata — that the tags are intact, that it is unworn and unwashed, and that the fault is the one described.",
  },
  {
    title: "Money back",
    text: "Once it passes, we release the refund the same day to the method you paid with. What happens after that is your bank's clearing time, set out below.",
  },
];

const ELIGIBLE = [
  "Arrived damaged, stained, or with a genuine weaving fault",
  "The wrong piece, size or colour was sent",
  "Materially different from its description or photographs",
  "Something listed on the invoice was missing from the parcel",
];

const NOT_ELIGIBLE = [
  "Worn, washed, dry-cleaned, or with the tags removed",
  "Blouses stitched or altered to your measurements",
  "Made-to-order and customised pieces",
  `Requested more than ${RETURN_DAYS} days after delivery`,
  "Gift cards and store-credit vouchers",
];

// Windows quoted from the day a return passes inspection. The Cash-on-delivery
// row is the slow one because there is no card to credit back to — it goes out
// as a bank transfer to the account you give us.
const TIMELINE = [
  { method: "Credit or debit card", wait: "5–7 business days" },
  { method: "UPI", wait: "3–5 business days" },
  { method: "Net banking", wait: "5–7 business days" },
  { method: "Wallet", wait: "1–2 business days" },
  { method: "Cash on delivery", wait: "7–10 business days, by bank transfer" },
];

const RefundPolicy = () => {
  const { isDarkMode } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // Gentle fade and rise, staggered, disabled outright for anyone who asked for
  // less motion.
  const reveal = (i) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay: Math.min(i, 6) * 0.06 },
        };

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
              Return &amp; Refund Policy
            </span>
          </nav>

          {/* ── Masthead ─────────────────────────────────────────────────── */}
          <motion.div {...reveal(0)}>
            <p className={styles.kicker}>Policies</p>
            <h1 className={styles.title}>Return &amp; Refund Policy</h1>
            <p className={styles.updated}>
              Last updated: {POLICY_LAST_UPDATED}
            </p>
            <p className={styles.standfirst}>
              A handwoven piece has to be seen and held to be judged. If the one
              that reached you is not right, this is how it comes back to us and
              how your money comes back to you.
            </p>
          </motion.div>

          {/* ── The window, stated once ──────────────────────────────────── */}
          <motion.div className={styles.banner} {...reveal(1)}>
            <p className={styles.bannerLabel}>The window</p>
            <p className={styles.bannerText}>
              {RETURN_DAYS} days from the day your parcel is delivered.
            </p>
            <p className={styles.bannerNote}>
              Ask us inside those {RETURN_DAYS} days and the return is free —
              we arrange the pickup and we pay for it. There is no restocking
              fee and no charge for the collection.
            </p>
          </motion.div>

          <div className={styles.sections}>
            {/* ── 01. How a return works ─────────────────────────────────── */}
            <motion.section className={styles.section} {...reveal(2)}>
              <span className={styles.sectionNum} aria-hidden="true">
                01
              </span>
              <h2 className={styles.sectionTitle}>How a return works</h2>
              <p className={styles.prose}>
                Four steps, and we do three of them. You only have to tell us
                and hand the parcel over.
              </p>
              <ol className={styles.steps}>
                {STEPS.map((step, i) => (
                  <li key={step.title} className={styles.step}>
                    <span className={styles.stepNum} aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                      <p className={styles.stepText}>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.section>

            {/* ── 02. What can come back ─────────────────────────────────── */}
            <motion.section className={styles.section} {...reveal(3)}>
              <span className={styles.sectionNum} aria-hidden="true">
                02
              </span>
              <h2 className={styles.sectionTitle}>What can come back</h2>
              <p className={styles.prose}>
                Silk keeps a record of how it has been handled, so the condition
                a piece returns in is the one thing we are strict about. A piece
                that has been worn, washed or perfumed cannot go back on the
                shelf.
              </p>
              <p className={styles.prose}>
                Please read a slub in the weave, a small unevenness in the zari
                or a slight difference between the colour on your screen and the
                colour in your hands as what they are — the marks of a handloom
                and a natural fibre, not defects. A genuine flaw is a different
                matter, and it comes back.
              </p>

              <div className={styles.columns}>
                <div>
                  <h3 className={styles.columnLabel}>We will take it back</h3>
                  <ul className={styles.checkList}>
                    {ELIGIBLE.map((item) => (
                      <li key={item} className={styles.checkItem}>
                        <span
                          className={`${styles.mark} ${styles.markYes}`}
                          aria-hidden="true"
                        >
                          &#10003;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className={styles.columnLabel}>We cannot</h3>
                  <ul className={styles.checkList}>
                    {NOT_ELIGIBLE.map((item) => (
                      <li key={item} className={styles.checkItem}>
                        <span
                          className={`${styles.mark} ${styles.markNo}`}
                          aria-hidden="true"
                        >
                          &#10005;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* ── 03. When the money arrives ─────────────────────────────── */}
            <motion.section className={styles.section} {...reveal(4)}>
              <span className={styles.sectionNum} aria-hidden="true">
                03
              </span>
              <h2 className={styles.sectionTitle} id="refund-table-heading">
                When the money arrives
              </h2>
              <p className={styles.prose}>
                We release the refund on the day the return passes inspection.
                Everything below is the clearing time after that, and it belongs
                to your bank rather than to us.
              </p>

              {/* The wrapper is the scroller, focusable and labelled so the
                  table can be panned from the keyboard on a narrow phone. */}
              <div
                className={styles.tableWrap}
                role="region"
                aria-labelledby="refund-table-heading"
                tabIndex={0}
              >
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Paid by</th>
                      <th scope="col">Refund reaches you in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIMELINE.map((row) => (
                      <tr key={row.method}>
                        <th scope="row">{row.method}</th>
                        <td>{row.wait}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.tableHint} aria-hidden="true">
                Scroll the table sideways to see both columns.
              </p>

              <p className={`${styles.prose} ${styles.proseAfterTable}`}>
                Where you paid by cash on delivery there is no card to credit,
                so we ask for a bank account and send the money there. If the
                refund has not reached you a working day after the window above,
                write to us and we will chase it with the gateway.
              </p>
            </motion.section>
          </div>

          {/* ── Colophon ─────────────────────────────────────────────────── */}
          <div className={styles.colophon}>
            <p className={styles.colophonLabel}>Help with a return</p>
            <p className={styles.colophonText}>
              <Link to="/support" className={styles.link}>
                Write to the care desk
              </Link>{" "}
              or email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.link}>
                {SUPPORT_EMAIL}
              </a>{" "}
              with your order number. A person answers, and they can start the
              return for you.
            </p>
            <p className={styles.colophonText}>
              This policy forms part of our{" "}
              <Link to="/terms" className={styles.link}>
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
