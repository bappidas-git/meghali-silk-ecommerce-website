// =============================================================================
// OUR STORY  —  Meghali's Silk, route `/about`
// =============================================================================
// The flagship spread. Every other page in the storefront has a job to do —
// sell, confirm, reassure, collect a message. This one only has to be read, so
// it is set as a magazine long-read: a full-bleed opening, chapters that hang
// their tracked label in the margin beside a 68ch column of prose, two image
// bands, and hairlines instead of cards from top to bottom.
//
// THE MOVEMENTS
//   1. THE OPENING    — eyebrow, serif headline, standfirst, a ruled meta line,
//      and an establishing image that runs the width of the viewport.
//   2. THE HOUSE      — the heritage prose at reading measure, opened by a
//      serif lead paragraph.
//   3. THE FIBRE      — Muga, Pat and Eri as a hairline list, closed by the
//      Mekhela Chador: what the drape is and how it arrives.
//   4. THE COLLECTION — one large 4:5 feature against a short column →
//      /products.
//   5. THE LOOM       — a full-bleed image band, presented AS an image.
//   6. WHAT WE HOLD TO— four values as a numbered hairline list.
//   7. THE JOURNEY    — 2010 / 2014 / 2019 / 2023 down a single vertical rule.
//   8. THE LINE       — the pull-quote, full width, on the heritage ground.
//   9. IN NUMBERS     — three quiet serif figures over tracked labels.
//  10. THE CLOSE      — Experience the heritage → /products + /support.
//
// WHAT THE REBUILD CORRECTED
//   • THE STORY WAS THE WRONG ONE. The old copy sold "Bengal handloom",
//     "Banarasi and Kanjivaram", "motifs of temple architecture and riverine
//     Bengal" — none of which is what this shop sells. The house is registered
//     in Kolkata (settings.store.address) but the silk is Assamese: Muga, Pat,
//     Eri and Nuni, handwoven in Sualkuchi on the north bank of the
//     Brahmaputra. Every claim here traces to db.json `settings.store` /
//     `.seo`, to the FAQ_ITEMS / WHY_CHOOSE_US entries in utils/constants.js,
//     or to the Support page — one voice across About / Support / Footer.
//   • THE PLAY BUTTON WAS A LIE. The media block carried a 72px play control
//     with aria-label="Play our story" wired to nothing. There is no video, so
//     the control is gone and the poster is presented honestly as a photograph
//     with a caption.
//   • "14+ YEARS" HAD GONE STALE. A hardcoded elapsed-time figure ages badly —
//     the house was founded in 2010, so that number was already wrong. The
//     figures are now the same three the Support page prints (2010 founded /
//     50+ artisan partners / 2023 award): dates and a count, nothing derived
//     from the clock, nothing that rots.
//   • NO RATINGS, NO CUSTOMER COUNTS, NO SUPERLATIVES. Nothing here claims a
//     market position the shop cannot evidence.
//
// STATIC BY DESIGN
//   The page makes no API calls and needs none — it owns its copy. The only
//   moving parts are the breadcrumb, two <Link>s and the reveals.
//
// THEMING
//   Tokens only, and this page deliberately does not consume ThemeContext:
//   every colour resolves through `--sf-*`, which flips under `body.dark`, so
//   light and dark are one stylesheet. (The `styles.dark` class the old page
//   toggled was never defined in the stylesheet.)
// =============================================================================
import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { onImageError } from "../../utils/helpers";
import styles from "./AboutUs.module.css";

// ---- Imagery --------------------------------------------------------------
// Recoloured placehold.co panels in the sampled brand palette — the same
// generator and the same ink/gold values the Prompt 12 hero and the Prompt 02
// catalogue seed use. The hexes below are URL parameters for that service, not
// CSS: the stylesheet itself carries no hex. The storefront therefore ships no
// third-party photography and never shows Meghali's Silk's own copyrighted
// images; onImageError degrades each one to the inline placeholder.
const IMAGES = {
  establishing:
    "https://placehold.co/2400x1000/1D1A16/C8912A?text=The+Looms+of+Sualkuchi",
  collection:
    "https://placehold.co/1200x1500/33261E/F0D06B?text=Muga+Mekhela+Chador",
  loom: "https://placehold.co/2000x1000/1D1A16/8A6118?text=In+the+Loom+Room",
};

// ---- The opening meta line ------------------------------------------------
// Three facts, tracked and ruled. The founding year is the Support page's; the
// two places are settings.store.address and settings.store.tagline.
const META = ["Est. 2010", "Kolkata", "Woven in Sualkuchi, Assam"];

// ---- The fibre ------------------------------------------------------------
// Straight from the FAQ set in utils/constants.js ("What is the difference
// between Muga, Pat, Eri and Nuni silk?" and the authenticity answer), so the
// Help Centre and this page describe the same silks the same way.
const SILKS = [
  {
    name: "Muga",
    note: "Undyed",
    text:
      "The golden silk unique to Assam — reared nowhere else. The deep honey colour is the fibre's own and never a dye, it is unusually strong, and it is one of the few silks that improves with age: softer and more lustrous every time it is washed.",
  },
  {
    name: "Pat",
    note: "Ivory",
    text:
      "The bright ivory-to-white mulberry silk, and the one most often woven with zari for weddings and festivals. It is the silk most of the occasion pieces in the shop are made from.",
  },
  {
    name: "Eri",
    note: "Handspun",
    text:
      "Soft, matte, and spun by hand before it is woven. Eri behaves more like a fine wool than a silk — quietly warm to wear — which is why it goes into the shawls and stoles rather than the drapes.",
  },
];

// ---- What we hold to ------------------------------------------------------
// The four values the old page carried, re-pointed at what this shop can
// actually stand behind. Each line traces to WHY_CHOOSE_US or to the FAQ.
const VALUES = [
  {
    index: "01",
    title: "Bought direct",
    text:
      "From weaving families in and around Sualkuchi, on the north bank of the Brahmaputra. We buy from the loom the piece came off.",
  },
  {
    index: "02",
    title: "Woven, not manufactured",
    text:
      "Every piece in the shop left a handloom. A handloom moves about a metre a day, and a Mekhela Chador can take weeks to come off the beam.",
  },
  {
    index: "03",
    title: "The fibre's own colour",
    text:
      "Undyed Muga is sold undyed and Eri is handspun. Each listing carries the details the weaver gave us for that particular piece.",
  },
  {
    index: "04",
    title: "Held to a standard",
    text:
      "In 2023 the house was honoured with a National Handloom Award for the craftsmanship behind this work.",
  },
];

// ---- The journey ----------------------------------------------------------
// The same four milestones the page has always carried, told on the river the
// silk actually comes from.
const JOURNEY = [
  {
    year: "2010",
    title: "The house opens",
    text:
      "Meghali's Silk begins in Kolkata as the flagship label of Galleria Producer Company Limited, selling Assamese handloom silk to people who could not get to the looms themselves.",
  },
  {
    year: "2014",
    title: "To the river",
    text:
      "Direct buying begins with master weaving families in and around Sualkuchi — no tier between the loom and the shop.",
  },
  {
    year: "2019",
    title: "A wider effort",
    text:
      "The house joins a National Handloom Development effort supporting weaving families.",
  },
  {
    year: "2023",
    title: "Recognition",
    text: "Honoured with a National Handloom Award for craftsmanship.",
  },
];

// ---- In numbers -----------------------------------------------------------
// Identical to the Support page's three marks. Two dates and a count — nothing
// derived from the clock, nothing the shop cannot evidence.
const MARKS = [
  { value: "2010", label: "Founded in Kolkata" },
  { value: "50+", label: "Artisan partners" },
  { value: "2023", label: "National Handloom Award" },
];

// The one glyph this page needs: the hairline arrow the storefront's quiet
// links carry (the same drawing language as the Support page's Glyph set).
const Arrow = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </svg>
);

const AboutUs = () => {
  const prefersReducedMotion = useReducedMotion();

  // Gentle fade and rise, disabled outright for anyone who asked for less
  // motion — the sections then paint at their final state on the first frame.
  const reveal = () =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.15 },
          transition: { duration: 0.6 },
        };

  return (
    <div className={styles.page}>
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            Home
          </Link>
          <span className={styles.breadcrumbSep} aria-hidden="true">
            /
          </span>
          <span className={styles.breadcrumbCurrent} aria-current="page">
            Our Story
          </span>
        </nav>
      </div>

      {/* ── 1. THE OPENING ─────────────────────────────────────────────── */}
      <header className={styles.opening}>
        <motion.div
          className={styles.container}
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 16 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.7 },
              })}
        >
          <p className={styles.eyebrow}>Our story</p>
          <h1 className={styles.title}>
            Three silks, one river, and the families who weave them.
          </h1>
          <p className={styles.standfirst}>
            Meghali's Silk began in Kolkata in 2010 on a single conviction: that
            the silk worth keeping is still made by hand, on the north bank of
            the Brahmaputra, by weavers who learned the loom from their mothers.
          </p>
          <ul className={styles.meta}>
            {META.map((item) => (
              <li key={item} className={styles.metaItem}>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className={styles.establishing}>
          <img
            src={IMAGES.establishing}
            alt="A row of handlooms in a weaving shed in Sualkuchi, Assam"
            width="2400"
            height="1000"
            onError={onImageError}
          />
        </div>
      </header>

      {/* ── 2. THE HOUSE ───────────────────────────────────────────────── */}
      <motion.section className={styles.chapter} {...reveal()}>
        <div className={styles.container}>
          <div className={styles.chapterGrid}>
            <div className={styles.chapterLabel}>
              <p className={styles.eyebrow}>The house</p>
            </div>
            <div className={styles.chapterBody}>
              <h2 className={styles.chapterTitle}>
                A Kolkata house, an Assamese loom
              </h2>
              <div className={styles.prose}>
                <p className={styles.proseLead}>
                  Meghali's Silk is the flagship label of{" "}
                  <strong>Galleria Producer Company Limited</strong>, a producer
                  company on Park Street in Kolkata built around a single trade:
                  Assamese handloom silk.
                </p>
                <p>
                  We do not own a mill, and we do not want one. Every piece in
                  the shop is bought directly from weaving families in and
                  around Sualkuchi — the silk village on the north bank of the
                  Brahmaputra — where a handloom moves about a metre a day and a
                  Mekhela Chador can take weeks to come off the beam.
                </p>
                <p>
                  What that buys is not speed. It is a cloth with the weaver's
                  hand still in it: the small irregularities of a shuttle thrown
                  by a person, a depth of surface no power loom reproduces, and
                  yarn that was never blended to make it cheaper. In 2023 that
                  way of working was recognised with a National Handloom Award.
                </p>
                <p>
                  We remain a producer company at heart. The structure exists so
                  that what the shop earns finds its way back to the looms it
                  came from, and so the families at those looms have somewhere
                  steady to sell.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 3. THE FIBRE ───────────────────────────────────────────────── */}
      <motion.section
        className={`${styles.chapter} ${styles.chapterRuled}`}
        {...reveal()}
      >
        <div className={styles.container}>
          <div className={styles.chapterGrid}>
            <div className={styles.chapterLabel}>
              <p className={styles.eyebrow}>The fibre</p>
            </div>
            <div className={styles.chapterBody}>
              <h2 className={styles.chapterTitle}>Muga, Pat and Eri</h2>
              <div className={styles.prose}>
                <p>
                  Four silks come off the looms we buy from. Three of them carry
                  the collection; the fourth, Nuni, is a mulberry silk with a
                  quieter finish that turns up in the everyday weaves. Every
                  listing states which of them a piece is woven in.
                </p>
              </div>

              <dl className={styles.silks}>
                {SILKS.map((silk) => (
                  <div key={silk.name} className={styles.silk}>
                    <dt className={styles.silkTerm}>
                      <span className={styles.silkName}>{silk.name}</span>
                      <span className={styles.silkNote}>{silk.note}</span>
                    </dt>
                    <dd className={styles.silkText}>{silk.text}</dd>
                  </div>
                ))}
              </dl>

              <div className={`${styles.prose} ${styles.drape}`}>
                <h3 className={styles.subTitle}>The Mekhela Chador</h3>
                <p>
                  Not a saree, and not a version of one. The Mekhela Chador is a
                  two-piece drape — the mekhela worn as the lower wrap, the
                  chador taken over it — and it is what Assam wears to weddings,
                  to Bihu and to ordinary days.
                </p>
                <p>
                  Ours arrive unstitched and unpleated, exactly as they leave
                  the loom, so your own tailor can pleat, hem and finish them to
                  your measurements. A matching blouse piece is listed
                  separately wherever one has been woven for the set.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 4. THE COLLECTION ──────────────────────────────────────────── */}
      <motion.section className={styles.chapter} {...reveal()}>
        <div className={styles.container}>
          <div className={styles.feature}>
            <div className={styles.featureMedia}>
              <img
                src={IMAGES.collection}
                alt="A Muga Mekhela Chador in its natural honey gold, laid out full length"
                width="1200"
                height="1500"
                loading="lazy"
                onError={onImageError}
              />
            </div>
            <div className={styles.featureText}>
              <p className={styles.eyebrow}>The collection</p>
              <h2 className={styles.chapterTitle}>
                Everything here came off a handloom
              </h2>
              <div className={styles.prose}>
                <p>
                  Mekhela Chador sets in Muga, Pat, Eri and Nuni. Sarees. Eri
                  shawls and stoles for the cold months. Blouse pieces and
                  running fabric. A short shelf of gifts and keepsakes, and the
                  bridal pieces that take longest of all.
                </p>
                <p>
                  Each listing carries what the weaver told us about that
                  particular piece — the silk, the work in it, and the
                  measurements wherever they were supplied.
                </p>
              </div>
              <Link to="/products" className={styles.textLink}>
                See the collection
                <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 5. THE LOOM — an image band, presented as one ───────────────── */}
      <motion.figure className={styles.loom} {...reveal()}>
        <img
          src={IMAGES.loom}
          alt="A weaver at a handloom, a length of golden Muga silk on the beam"
          width="2000"
          height="1000"
          loading="lazy"
          onError={onImageError}
        />
        <figcaption className={styles.loomCaption}>
          <span className={styles.container}>
            Sualkuchi, on the north bank of the Brahmaputra. Every piece we sell
            begins on a loom like this one.
          </span>
        </figcaption>
      </motion.figure>

      {/* ── 6. WHAT WE HOLD TO ─────────────────────────────────────────── */}
      <motion.section className={styles.chapter} {...reveal()}>
        <div className={styles.container}>
          <div className={styles.chapterGrid}>
            <div className={styles.chapterLabel}>
              <p className={styles.eyebrow}>What we hold to</p>
            </div>
            <div className={styles.chapterBody}>
              <h2 className={styles.chapterTitle}>Four things, kept</h2>
              <ol className={styles.values}>
                {VALUES.map((value) => (
                  <li key={value.index} className={styles.value}>
                    <span className={styles.valueIndex} aria-hidden="true">
                      {value.index}
                    </span>
                    <h3 className={styles.valueTitle}>{value.title}</h3>
                    <p className={styles.valueText}>{value.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 7. THE JOURNEY ─────────────────────────────────────────────── */}
      <motion.section
        className={`${styles.chapter} ${styles.chapterRuled}`}
        {...reveal()}
      >
        <div className={styles.container}>
          <div className={styles.chapterGrid}>
            <div className={styles.chapterLabel}>
              <p className={styles.eyebrow}>The journey</p>
            </div>
            <div className={styles.chapterBody}>
              <h2 className={styles.chapterTitle}>Four marks on the way</h2>
              <ol className={styles.timeline}>
                {JOURNEY.map((step) => (
                  <li key={step.year} className={styles.step}>
                    <span className={styles.stepYear}>{step.year}</span>
                    <div className={styles.stepBody}>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                      <p className={styles.stepText}>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 8. THE LINE — the pull-quote, full width ────────────────────── */}
      <motion.section className={styles.quoteBand} {...reveal()}>
        <div className={styles.container}>
          <blockquote className={styles.quote}>
            <p className={styles.quoteText}>
              &ldquo;We don't manufacture silk. We keep a craft alive, one loom
              at a time.&rdquo;
            </p>
            <cite className={styles.quoteCite}>Meghali's Silk</cite>
          </blockquote>
        </div>
      </motion.section>

      {/* ── 9. IN NUMBERS ──────────────────────────────────────────────── */}
      <motion.section className={styles.chapter} {...reveal()}>
        <div className={styles.container}>
          <h2 className={styles.marksHeading}>
            <span className={styles.eyebrow}>In numbers</span>
          </h2>
          <ul className={styles.marks}>
            {MARKS.map((mark) => (
              <li key={mark.label} className={styles.mark}>
                <span className={styles.markValue}>{mark.value}</span>
                <span className={styles.markLabel}>{mark.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* ── 10. THE CLOSE ──────────────────────────────────────────────── */}
      <motion.section className={styles.close} {...reveal()}>
        <div className={styles.container}>
          <h2 className={styles.closeTitle}>Experience the heritage</h2>
          <p className={styles.closeText}>
            Come and see what a handloom does that nothing else can — or write
            to us, and someone at the desk in Kolkata will help you choose.
          </p>
          <div className={styles.closeActions}>
            <Link
              to="/products"
              className={`sf-btn sf-btn--emerald sf-btn--lg ${styles.closeBtn}`}
            >
              Explore the collection
            </Link>
            <Link
              to="/support"
              className={`sf-btn sf-btn--lg ${styles.closeGhost}`}
            >
              Talk to us
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default AboutUs;
