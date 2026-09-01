// =============================================================================
// COOKIE POLICY  —  Meghali's Silk, route `/cookies`
// =============================================================================
// One of the four policy pages (/privacy, /terms, /cookies, /refund) that share
// a single typeset "document" treatment: a tracked gold kicker, a serif title
// over a hairline, the revision stamp, a standfirst, then numbered clauses down
// a ~70-character measure with their numbers hung out into the left gutter. See
// the stylesheet header for the shared vocabulary.
//
// WHAT THE REBUILD CORRECTED
//   • THE TABLE WAS NOT A TABLE. Four columns of <div>s in a CSS grid, with
//     `data-label` pseudo-elements faking row headers on mobile: a screen
//     reader got twelve loose strings with nothing tying a cell to its column.
//     It is now a real <table> — `<th scope="col">` across the head, the cookie
//     type as `<th scope="row">` — inside a focusable, labelled scroller, so it
//     can be reached and panned from the keyboard and cannot widen the page.
//   • THE COPY DESCRIBED NOBODY'S COOKIES. "Remember your preferences" is true
//     of every site; the purposes now name what this one actually keeps — the
//     cart, the session, the light/dark choice.
//   • THE LAST COLUMN SAID "YES"/"NO" UNDER A HEAD READING "REQUIRED", which
//     is a double negative waiting to happen. It reads "Always on" / "Optional"
//     under a head reading "Status".
//   • THE PAGE STOOD ALONE. It now links across to the Privacy Policy, which is
//     where the wider data question is answered.
//
// STATIC BY DESIGN
//   No API calls and none needed. `POLICY_LAST_UPDATED` is shared with the
//   other three policy pages so they can never disagree about their date.
//
// THEMING
//   Tokens only; ThemeContext is consumed for nothing but the `color-scheme`
//   hint, which here also themes the table's own scrollbar.
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
import styles from "./CookiePolicy.module.css";

// The four families of cookie the site sets, in descending order of necessity.
const COOKIE_TYPES = [
  {
    type: "Essential",
    purpose:
      "Holds your cart between visits, keeps you signed in, and carries the security tokens that protect checkout.",
    duration: "Session – 1 year",
    required: true,
  },
  {
    type: "Functional",
    purpose:
      "Remembers the choices you have made — your light or dark theme, and the pieces you have recently looked at.",
    duration: "1 year",
    required: false,
  },
  {
    type: "Analytics",
    purpose:
      "Tells us, in aggregate, which pages and which weaves are being looked at, so we know what to photograph and stock.",
    duration: "2 years",
    required: false,
  },
  {
    type: "Marketing",
    purpose:
      "Measures how a campaign performed and lets us show our pieces to you on other sites.",
    duration: "90 days",
    required: false,
  },
];

const CookiePolicy = () => {
  // Store name and contact details are whatever the admin last saved in
  // Settings > General, so the policy never names a store that no longer exists.
  const { storeName, email: supportEmail, emailHref } = useStoreSettings();
  const { isDarkMode } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  // The shared reveal from theme/motion.js: one gentle fade and rise, stepped
  // down the page and capped. It returns nothing at all under reduced motion,
  // so the clauses paint at their final state on the first frame.
  const reveal = (i) => sharedReveal(prefersReducedMotion, { index: i });

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
              Cookie Policy
            </span>
          </nav>

          {/* ── Masthead ─────────────────────────────────────────────────── */}
          <motion.div {...reveal(0)}>
            <p className={styles.kicker}>Policies</p>
            <h1 className={styles.title}>Cookie Policy</h1>
            <p className={styles.updated}>
              Last updated: {POLICY_LAST_UPDATED}
            </p>
            <p className={styles.standfirst}>
              {storeName} uses cookies to keep your cart, remember how you like
              the site set, and understand which weaves are being looked at.
              This is the full list, and how to turn off the ones you would
              rather not have.
            </p>
          </motion.div>

          <div className={styles.sections}>
            {/* ── 01. What cookies are ───────────────────────────────────── */}
            <motion.section className={styles.section} {...reveal(1)}>
              <span className={styles.sectionNum} aria-hidden="true">
                01
              </span>
              <h2 className={styles.sectionTitle}>What a cookie is</h2>
              <p className={styles.prose}>
                A cookie is a small text file that a site asks your browser to
                keep. On the next page you open, the browser hands it back, and
                that is how a site remembers that the sari you added is still in
                your cart and that you are the person who added it.
              </p>
              <p className={styles.prose}>
                Cookies cannot read the rest of your device, and ours hold
                identifiers rather than personal details. What we do with the
                data behind those identifiers is set out in our{" "}
                <Link to="/privacy" className={styles.link}>
                  Privacy Policy
                </Link>
                .
              </p>
              <p className={styles.prose}>
                Some of what is listed below is kept in your browser's local
                storage rather than in a cookie proper — your cart, your theme
                and your recently viewed pieces are held that way. It is the
                same bargain either way, so this policy covers both, and
                clearing your site data clears all of it.
              </p>
            </motion.section>

            {/* ── 02. The cookies we set ─────────────────────────────────── */}
            <motion.section className={styles.section} {...reveal(2)}>
              <span className={styles.sectionNum} aria-hidden="true">
                02
              </span>
              <h2 className={styles.sectionTitle} id="cookie-table-heading">
                The cookies we set
              </h2>
              <p className={styles.prose}>
                Only the essential family is required for the site to work.
                Everything else can be refused without losing your cart or your
                order history.
              </p>

              {/* The wrapper is the scroller, and it is focusable and labelled
                  so the table can be panned from the keyboard on a phone. */}
              <div
                className={styles.tableWrap}
                role="region"
                aria-labelledby="cookie-table-heading"
                tabIndex={0}
              >
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col" className={styles.colPurpose}>
                        Purpose
                      </th>
                      <th scope="col">Lifetime</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COOKIE_TYPES.map((cookie) => (
                      <tr key={cookie.type}>
                        <th scope="row">{cookie.type}</th>
                        <td>{cookie.purpose}</td>
                        <td>{cookie.duration}</td>
                        <td>
                          <span
                            className={`${styles.status} ${
                              cookie.required ? styles.statusRequired : ""
                            }`}
                          >
                            {cookie.required ? "Always on" : "Optional"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.tableHint} aria-hidden="true">
                Scroll the table sideways to see every column.
              </p>
            </motion.section>

            {/* ── 03. Managing cookies ───────────────────────────────────── */}
            <motion.section className={styles.section} {...reveal(3)}>
              <span className={styles.sectionNum} aria-hidden="true">
                03
              </span>
              <h2 className={styles.sectionTitle}>Turning them off</h2>
              <p className={styles.prose}>
                Every browser lets you block or clear cookies, usually under
                Settings, then Privacy. You can refuse them for this site alone
                or for every site, and you can delete the ones already stored.
              </p>
              <p className={styles.prose}>
                Blocking the essential family will stop the cart and the
                sign-in from working — the site cannot remember you without it.
                Blocking the other three costs you nothing but the convenience
                of not setting your preferences again.
              </p>
            </motion.section>
          </div>

          {/* ── Colophon ─────────────────────────────────────────────────── */}
          <div className={styles.colophon}>
            <p className={styles.colophonLabel}>Questions about cookies</p>
            <p className={styles.colophonText}>
              Write to{" "}
              <a href={emailHref} className={styles.link}>
                {supportEmail}
              </a>{" "}
              and we will tell you exactly what a given cookie holds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
