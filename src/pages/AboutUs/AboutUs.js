import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { onImageError } from "../../utils/helpers";
import styles from "./AboutUs.module.css";

// Static brand storytelling — no API. All copy authored here (this page owns it).
const TAGS = [
  { icon: "mdi:hand-back-right", label: "Handloom Heritage" },
  { icon: "mdi:trophy-award", label: "National Award Winner" },
  { icon: "mdi:certificate", label: "100% Authentic Silk" },
];

const VALUES = [
  {
    icon: "mdi:temple-hindu",
    accent: "purple",
    title: "Heritage",
    description: "Rooted in generations of Bengal handloom tradition.",
  },
  {
    icon: "mdi:hand-heart",
    accent: "teal",
    title: "Craftsmanship",
    description: "Every weave inspected by hand for purity and finish.",
  },
  {
    icon: "mdi:leaf",
    accent: "orange",
    title: "Sustainability",
    description: "Small-batch, natural dyes and traceable silk.",
  },
  {
    icon: "mdi:trophy-award",
    accent: "pink",
    title: "Excellence",
    description: "National Handloom Award-winning standards.",
  },
];

const JOURNEY = [
  {
    year: "2010",
    title: "The Beginning",
    description:
      "Founded in Kolkata to bring authentic Bengal handloom silk to a wider audience.",
  },
  {
    year: "2014",
    title: "Expanding Artistry",
    description: "Partnered with master weaver clusters across West Bengal.",
  },
  {
    year: "2019",
    title: "NHDC Initiative",
    description:
      "Joined a National Handloom Development effort to support weaving families.",
  },
  {
    year: "2023",
    title: "National Recognition",
    description: "Honoured with a National Handloom Award for craftsmanship.",
  },
];

const IMPACT = [
  { number: "14+", label: "Years" },
  { number: "50+", label: "Artisans" },
  { number: "2023", label: "Award · National Handloom" },
];

// Shared subtle reveal — respects reduced-motion via tokens; kept gentle.
const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5 },
};

const AboutUs = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link> <span aria-hidden="true">/</span>{" "}
        <span>About Us</span>
      </div>

      {/* 1. Hero / emblem */}
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className={styles.emblem} aria-hidden="true">
          <Icon icon="mdi:diamond-stone" />
        </span>
        <h1>Our Story</h1>
        <p className={styles.heroSubtitle}>Est. 2010 · Galleria Silk</p>

        {/* 2. Tag chips */}
        <ul className={styles.tagRow}>
          {TAGS.map((tag) => (
            <li key={tag.label} className={styles.tag}>
              <Icon icon={tag.icon} aria-hidden="true" />
              <span>{tag.label}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* 3. Our Heritage */}
      <motion.section className={styles.heritage} {...reveal}>
        <h2 className={styles.heading}>Our Heritage</h2>
        <p>
          Meghali's Silk is the flagship label of{" "}
          <strong>Galleria Producer Company Limited</strong>, a Kolkata-rooted
          house devoted to the living craft of Bengal handloom. For over a decade
          we have worked hand-in-hand with master weavers across West Bengal,
          translating generations of loom knowledge into sarees, suits and
          dupattas woven from pure, traceable silk.
        </p>
        <p>
          Every drape begins at the loom, not the factory. Our artisans dress
          each warp by hand, dye in small batches, and weave motifs that carry
          the memory of temple architecture and riverine Bengal. The result is
          silk you can feel the hours in — honest, breathable, and made to be
          worn for a lifetime.
        </p>
        <p>
          Recognised with a National Handloom Award, we remain a producer company
          at heart: profits and pride flow back to the weaving families who make
          Meghali's Silk what it is.
        </p>
      </motion.section>

      {/* 4. Master Silk Collection feature row */}
      <motion.section className={styles.feature} {...reveal}>
        <div className={styles.featureMedia}>
          <img
            src="https://placehold.co/700x900/0B3B2E/CBA35A?text=Master+Silk"
            alt="A master silk saree from the Meghali's Silk collection"
            loading="lazy"
            onError={onImageError}
          />
        </div>
        <div className={styles.featureBody}>
          <h2 className={styles.heading}>Our Master Silk Collection</h2>
          <p>
            From the regal sheen of <strong>Banarasi</strong> and{" "}
            <strong>Kanjivaram</strong> to the earthy texture of{" "}
            <strong>Tussar</strong>, <strong>Mulberry</strong>,{" "}
            <strong>Eri</strong> and <strong>Muga</strong> — every weave family in
            our collection is sourced traceably and finished by hand.
          </p>
          <Link to="/products" className={styles.textLink}>
            Explore the collection
            <Icon icon="mdi:arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </motion.section>

      {/* 5. Media / video block */}
      <motion.section className={styles.media} {...reveal}>
        <div className={styles.mediaPoster}>
          <img
            src="https://placehold.co/1200x600/0A2E24/CBA35A?text=The+Loom"
            alt="Master weavers at the loom crafting Meghali's Silk"
            loading="lazy"
            onError={onImageError}
          />
          <button
            type="button"
            className={styles.playBtn}
            aria-label="Play our story"
          >
            <Icon icon="mdi:play" aria-hidden="true" />
          </button>
        </div>
        <p className={styles.mediaCaption}>Watch how our silk is woven</p>
      </motion.section>

      {/* 6. Our Values */}
      <motion.section className={styles.values} {...reveal}>
        <h2 className={styles.heading}>Our Values</h2>
        <div className={styles.valuesGrid}>
          {VALUES.map((value) => (
            <div key={value.title} className={styles.valueCard}>
              <span
                className={`${styles.valueIcon} ${styles[`accent-${value.accent}`]}`}
                aria-hidden="true"
              >
                <Icon icon={value.icon} />
              </span>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 7. Our Journey — vertical timeline */}
      <motion.section className={styles.journey} {...reveal}>
        <h2 className={styles.heading}>Our Journey</h2>
        <ol className={styles.timeline}>
          {JOURNEY.map((step) => (
            <li key={step.year} className={styles.timelineItem}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <span className={styles.timelineYear}>{step.year}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* 8. Pull-quote */}
      <motion.section className={styles.quoteBand} {...reveal}>
        <blockquote className={styles.quote}>
          “We don't manufacture silk — we keep a craft alive, one loom at a
          time.”
          <cite className={styles.quoteCite}>Meghali's Silk</cite>
        </blockquote>
      </motion.section>

      {/* 9. Our Impact — stat band */}
      <motion.section className={styles.impact} {...reveal}>
        <span className={styles.impactLabel}>Our Impact</span>
        <div className={styles.impactGrid}>
          {IMPACT.map((stat) => (
            <div key={stat.label} className={styles.impactStat}>
              <span className={styles.impactNumber}>{stat.number}</span>
              <span className={styles.impactStatLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 10. Experience Our Heritage — CTA */}
      <motion.section className={styles.cta} {...reveal}>
        <h2 className={styles.heading}>Experience Our Heritage</h2>
        <p className={styles.ctaSubtitle}>
          Discover handwoven silk that carries the memory of Bengal's looms.
        </p>
        <div className={styles.ctaActions}>
          <Link to="/products" className={styles.ctaPrimary}>
            Explore Collection
          </Link>
          <Link to="/support" className={styles.ctaSecondary}>
            Talk to us
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default AboutUs;
