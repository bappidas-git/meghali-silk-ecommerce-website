// =============================================================================
// HELP CENTRE  —  Meghali's Silk, route `/help`
// =============================================================================
// The reference shelf next door to the care desk. Where `/support` is a letter
// you write, this is a book you look something up in — so it is set as one:
// a search line, a contents page, and the answers themselves.
//
//   1. THE OPENING — eyebrow, serif question, and the search field. Typing
//      filters the FAQ set live on question AND answer text (unchanged), and
//      the number of matches is announced.
//   2. THE CONTENTS — the same six destinations as before (/orders, /refund,
//      /support, /profile, /special-offers, /privacy), now drawn identically.
//      The old rainbow `--sf-cat-*` accent per card is retired: six colours for
//      six equal topics was decoration pretending to be information.
//   3. THE ANSWERS — the Prompt 16 hairline accordion: tracked ordinal, the
//      question in reading size, a thin plus that loses its upright when open.
//      An empty result set says so and points at the care desk.
//   4. THE CLOSING BAND — hours, the two live channels, and the way through to
//      `/support`.
//
// THE COPY IS NOT WRITTEN HERE
//   Every answer comes from the admin's FAQ set (Admin > Storefront > FAQs),
//   read through FaqContext — the same collection the shared FAQ block and the
//   PDP panel read, where each window and threshold is one the store actually
//   runs on. Only the answers switched on for the Help Centre appear here. The
//   hours, email and phone are the same constants the Footer and the Contact
//   page print.
// =============================================================================
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import { useFaqs } from "../../context/FaqContext";
import { SUPPORT_HOURS } from "../../utils/constants";
import styles from "./HelpCenter.module.css";

// ---- Inline icon set ------------------------------------------------------
// Hairline weight, stroke = currentColor. Same drawing language as the Contact
// page, so the two care surfaces are visibly one pair.
const Glyph = ({ name, size = 20, strokeWidth = 1.3 }) => {
  const paths = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.6" />
        <path d="m15.6 15.6 4 4" />
      </>
    ),
    close: <path d="M6 6 18 18M18 6 6 18" />,
    arrow: (
      <>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    mail: (
      <>
        <rect x="2.75" y="5" width="18.5" height="14" rx="1.5" />
        <path d="m3.4 6.2 8.6 6.3 8.6-6.3" />
      </>
    ),
    phone: (
      <path d="M6.2 3.5h3l1.4 3.5-1.8 1.3a11.5 11.5 0 0 0 5.4 5.4l1.3-1.8 3.5 1.4v3a1.9 1.9 0 0 1-2.1 1.9A15.8 15.8 0 0 1 4.3 5.6 1.9 1.9 0 0 1 6.2 3.5Z" />
    ),
    parcel: (
      <>
        <path d="M20.5 7.8v8.4L12 21 3.5 16.2V7.8L12 3Z" />
        <path d="m3.7 7.7 8.3 4.6 8.3-4.6" />
        <path d="M12 12.3V21" />
      </>
    ),
    refund: (
      <>
        <path d="M4.2 10.4a8 8 0 1 1 .6 5.2" />
        <path d="M3.6 5.2v5.2h5.2" />
      </>
    ),
    card: (
      <>
        <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2" />
        <path d="M2.8 9.8h18.4" />
        <path d="M6.4 14.6h3.4" />
      </>
    ),
    account: (
      <>
        <circle cx="12" cy="8.4" r="3.8" />
        <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
      </>
    ),
    tag: (
      <>
        <path d="M11.2 3.5H20v8.8l-8.6 8.6a1.4 1.4 0 0 1-2 0l-6.8-6.8a1.4 1.4 0 0 1 0-2Z" />
        <circle cx="16.3" cy="7.7" r="1.3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3.2 19.4 6v6c0 4.2-3.1 7.3-7.4 8.8C7.7 19.3 4.6 16.2 4.6 12V6Z" />
        <path d="m9.2 12.1 2 2 3.6-3.9" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] || null}
    </svg>
  );
};

// The contents page. Same six routes as before, all drawn the same way — the
// per-card accent colour is deliberately gone.
const TOPICS = [
  {
    glyph: "parcel",
    title: "Orders & delivery",
    desc: "Follow a parcel, check a window, read what shipping costs",
    to: "/orders",
  },
  {
    glyph: "refund",
    title: "Returns & refunds",
    desc: "The seven-day window, how to send a piece back, when money returns",
    to: "/refund",
  },
  {
    glyph: "card",
    title: "Payments",
    desc: "Cards, UPI, net banking, wallets and Cash on Delivery",
    to: "/support",
  },
  {
    glyph: "account",
    title: "Account & addresses",
    desc: "Your details, saved addresses, passwords and sign-in",
    to: "/profile",
  },
  {
    glyph: "tag",
    title: "Offers & coupons",
    desc: "Codes that are running now and how they apply at checkout",
    to: "/special-offers",
  },
  {
    glyph: "shield",
    title: "Privacy & security",
    desc: "What we hold, how it is kept, and how to have it removed",
    to: "/privacy",
  },
];

const HelpCenter = () => {
  const { isDarkMode } = useTheme();
  // The care desk's own address and number, as set in Settings > General.
  const {
    email: supportEmail,
    phone: supportPhone,
    emailHref,
    phoneHref,
    fillCopy,
  } = useStoreSettings();
  const [openFaq, setOpenFaq] = useState(null);
  const [query, setQuery] = useState("");
  // The answers the admin has switched on for the Help Centre, in their order.
  const { forPlacement } = useFaqs();
  const helpFaqs = useMemo(() => forPlacement("help"), [forPlacement]);

  // Unchanged behaviour: a match on the question OR anywhere in the answer.
  // Searched against the FILLED answer, so a shopper who types the store's own
  // COD ceiling or shipping figure finds the line that prints it.
  const filteredFaqs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return helpFaqs;
    return helpFaqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(term) ||
        fillCopy(faq.answer).toLowerCase().includes(term)
    );
  }, [query, fillCopy, helpFaqs]);

  const isSearching = query.trim().length > 0;

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        {/* ── 1. THE OPENING ────────────────────────────────────────────── */}
        <header className={styles.head}>
          <p className={styles.eyebrow}>Help centre</p>
          <h1 className={styles.title}>How can we help?</h1>
          <p className={styles.lede}>
            The questions we are asked most often, answered in full — on silk and
            its care, on delivery, on returns and on payment.
          </p>

          <div className={styles.search}>
            <label htmlFor="help-search">Search the answers</label>
            <div className={styles.searchRow}>
              <span className={styles.searchIcon}>
                <Glyph name="search" size={18} />
              </span>
              <input
                id="help-search"
                type="search"
                autoComplete="off"
                placeholder="Muga, delivery, returns…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {isSearching && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => setQuery("")}
                  aria-label="Clear the search"
                >
                  <Glyph name="close" size={16} />
                </button>
              )}
            </div>
            <p className={styles.searchStatus} role="status">
              {isSearching
                ? `${filteredFaqs.length} ${
                    filteredFaqs.length === 1 ? "answer" : "answers"
                  } for “${query.trim()}”`
                : ""}
            </p>
          </div>
        </header>

        {/* ── 2. THE CONTENTS ───────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="help-topics">
          <h2 className={styles.sectionTitle} id="help-topics">
            Browse by topic
          </h2>
          <div className={styles.topics}>
            {TOPICS.map((topic) => (
              <Link key={topic.to + topic.title} to={topic.to} className={styles.topic}>
                <span className={styles.topicIcon}>
                  <Glyph name={topic.glyph} />
                </span>
                <span className={styles.topicTitle}>{topic.title}</span>
                <span className={styles.topicDesc}>{topic.desc}</span>
                <span className={styles.topicArrow} aria-hidden="true">
                  <Glyph name="arrow" size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 3. THE ANSWERS ────────────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="help-faqs">
          <h2 className={styles.sectionTitle} id="help-faqs">
            Questions, answered
          </h2>

          {filteredFaqs.length === 0 ? (
            <p className={styles.noResults}>
              Nothing here matches “{query.trim()}”. Write to us instead — the
              care desk answers questions this page has not learned yet.{" "}
              <Link to="/support">Contact us</Link>.
            </p>
          ) : (
            <div className={styles.faqList}>
              {filteredFaqs.map((faq, i) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`}
                  >
                    <h3 className={styles.faqHeading}>
                      <button
                        type="button"
                        className={styles.faqQuestion}
                        aria-expanded={isOpen}
                        aria-controls={`help-faq-answer-${faq.id}`}
                        id={`help-faq-question-${faq.id}`}
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      >
                        <span className={styles.faqIndex} aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={styles.faqText}>{faq.question}</span>
                        <span className={styles.faqIcon} aria-hidden="true" />
                      </button>
                    </h3>
                    {isOpen && (
                      <div
                        className={styles.faqAnswer}
                        id={`help-faq-answer-${faq.id}`}
                        role="region"
                        aria-labelledby={`help-faq-question-${faq.id}`}
                      >
                        {fillCopy(faq.answer)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── 4. THE CLOSING BAND ─────────────────────────────────────────── */}
      <section className={styles.band} aria-labelledby="help-still">
        <div className={styles.container}>
          <div className={styles.bandInner}>
            <div>
              <h2 className={styles.bandTitle} id="help-still">
                Still need help?
              </h2>
              <p className={styles.bandLede}>
                The care desk is open {SUPPORT_HOURS}. Write, call, or send us a
                photograph of the piece you are asking about.
              </p>
              <p className={styles.bandMeta}>
                <a href={emailHref}>
                  <Glyph name="mail" size={16} />
                  {supportEmail}
                </a>
                <a href={phoneHref}>
                  <Glyph name="phone" size={16} />
                  {supportPhone}
                </a>
              </p>
            </div>
            <div className={styles.bandActions}>
              <Link to="/support" className={styles.primaryBtn}>
                Contact support
              </Link>
              <a href={emailHref} className={styles.ghostBtn}>
                Email us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;
