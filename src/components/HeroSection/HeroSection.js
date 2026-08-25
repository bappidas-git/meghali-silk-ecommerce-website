import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import apiService from "../../services/api";
import { categoryParam, resolveCategory } from "../../utils/categories";
import { onImageError } from "../../utils/helpers";
import { APP_NAME } from "../../utils/constants";
import styles from "./HeroSection.module.css";

/**
 * HeroSection — the storefront's cinematic opening.
 *
 * A full-bleed media stage (one layer per banner, slow crossfade) carrying an
 * editorial copy block in the lower-left: tracked eyebrow, large serif headline,
 * one quiet line, one gold CTA + one hairline CTA. Under it, a hairline index
 * row of tracked collection links.
 *
 * DATA (unchanged contract)
 *   • apiService.banners.getAll()    → slides, falling back to `defaultBanners`
 *   • apiService.categories.getAll() → the collection openers (top-level,
 *     active, in the admin's sortOrder, first 8)
 *
 * MOTION
 *   The only motion is the crossfade between stacked media layers — a CSS
 *   opacity transition, not a JS animation, so the active slide is painted at
 *   full opacity on the first frame and the hero never depends on a timeline to
 *   be legible. Autoplay (5s) pauses on hover AND on focus, and is disabled
 *   outright under prefers-reduced-motion (which also zeroes the crossfade),
 *   leaving a static first slide.
 */

// Default slide media for the offline fallback banner. This was a hardcoded
// Unsplash silk photo; it is now an on-brand recoloured placehold.co panel —
// the same generator and ink/gold palette the Prompt 02 catalogue seed uses —
// so the storefront ships no third-party photography and never shows Meghali's
// Silk's own copyrighted images. Seeded/admin banners that carry their own
// `image` override it; onImageError still degrades to the inline placeholder.
const SILK_HERO_IMAGE =
  "https://placehold.co/1600x900/1D1A16/8A6118?text=Handwoven+in+Assam";

// Brand fallback so the hero is never empty if the banners API is briefly
// unavailable. Real banners come from apiService.banners.getAll() (seeded in
// db.json). Uses a token-based gradient — no hardcoded hex.
const defaultBanners = [
  {
    id: "fallback-1",
    title: "Handwoven Assamese Silk",
    subtitle:
      "Muga, Pat and Eri from the looms of Sualkuchi — woven a metre a day.",
    cta: "Shop the Collection",
    link: "/products",
    gradient: "var(--sf-gradient-heritage)",
    image: SILK_HERO_IMAGE,
  },
];

// Eyebrow shown when a banner points somewhere that isn't a category (e.g. the
// offers page), so every slide opens on a tracked line of context.
const DEFAULT_EYEBROW = APP_NAME;

// Pull the `?category=` token out of a banner link so the eyebrow can name the
// collection the slide opens onto (banner links are relative app paths).
const categorySlugFromLink = (link) => {
  if (!link || !link.includes("?")) return "";
  return new URLSearchParams(link.split("?")[1]).get("category") || "";
};

const HeroSection = () => {
  const prefersReducedMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState(defaultBanners);
  const [categories, setCategories] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const controlRefs = useRef([]);

  // Fetch banners from API with fallback to defaults
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await apiService.banners.getAll();
        if (data && data.length > 0) {
          setBanners(data);
        }
      } catch {
        // Use default banners silently
      }
    };
    fetchBanners();
  }, []);

  // Fetch categories (the full list — the openers are derived below, and the
  // eyebrow resolves a banner's category slug against it).
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiService.categories.getAll();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch {
        console.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Collection openers: top-level, active, in the admin's sortOrder.
  const openers = useMemo(
    () =>
      categories
        .filter((c) => !c.parentId && c.isActive !== false)
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            String(a.name).localeCompare(String(b.name))
        )
        .slice(0, 8),
    [categories]
  );

  // Keep currentSlide in range if the banner list size changes (e.g. API
  // returns a different count than the defaults) so it never goes out of bounds.
  useEffect(() => {
    setCurrentSlide((prev) => (prev >= banners.length ? 0 : prev));
  }, [banners.length]);

  // Auto-slide (paused on hover/focus; disabled when the user prefers reduced
  // motion — that leaves the first slide standing still).
  useEffect(() => {
    if (isPaused || prefersReducedMotion || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused, prefersReducedMotion]);

  // The slide controls replace the old prev/next arrows: each hairline jumps to
  // its slide, and ←/→ step through them, carrying focus with the selection.
  const handleControlsKey = useCallback(
    (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next =
        e.key === "ArrowLeft"
          ? (currentSlide - 1 + banners.length) % banners.length
          : (currentSlide + 1) % banners.length;
      setCurrentSlide(next);
      controlRefs.current[next]?.focus();
    },
    [currentSlide, banners.length]
  );

  const activeBanner = banners[currentSlide] || {};
  const activeCategory = resolveCategory(
    categorySlugFromLink(activeBanner.link),
    categories
  );
  const eyebrow = activeCategory?.name || DEFAULT_EYEBROW;

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div
        className={styles.stage}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {/* Media stack — decorative, one layer per banner, crossfading. The
            copy is NOT stacked: it renders once, below, so the page keeps a
            single h1 and no off-screen CTA can be tabbed into. */}
        <div className={styles.media} aria-hidden="true">
          {banners.map((banner, index) => (
            <div
              key={banner.id ?? index}
              className={`${styles.slide} ${
                index === currentSlide ? styles.slideActive : ""
              }`}
            >
              <div
                className={styles.slideGround}
                style={
                  banner.gradient ? { background: banner.gradient } : undefined
                }
              />
              {(banner.image || banner.imageUrl) && (
                <img
                  className={styles.slideImage}
                  src={banner.image || banner.imageUrl}
                  alt=""
                  // The first slide is the largest thing above the fold — paint
                  // it eagerly at high priority; the rest can wait.
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchpriority={index === 0 ? "high" : "low"}
                  decoding="async"
                  onError={onImageError}
                />
              )}
              <div className={styles.weave} />
            </div>
          ))}
          <div className={styles.scrim} />
        </div>

        {/* Copy — one block, updated in place as the media crossfades. */}
        <div className={styles.copy}>
          <div
            className={styles.copyInner}
            aria-live={isPaused || prefersReducedMotion ? "polite" : "off"}
          >
            <p className={styles.eyebrow}>{eyebrow}</p>

            <h1 className={styles.headline}>{activeBanner.title}</h1>

            {activeBanner.subtitle && (
              <p className={styles.lede}>{activeBanner.subtitle}</p>
            )}

            <div className={styles.actions}>
              <Link
                to={activeBanner.link || "/products"}
                className={`sf-btn sf-btn--gold sf-btn--lg ${styles.ctaPrimary}`}
              >
                {activeBanner.cta || "Shop the Collection"}
              </Link>
              <Link to="/about" className={`sf-btn sf-btn--lg ${styles.ctaGhost}`}>
                Our Story
              </Link>
            </div>
          </div>
        </div>

        {/* Slide controls — hairlines, not dots. Keyboard: Tab to reach, ←/→
            to step. The arrows are gone; these carry the whole affordance. */}
        {banners.length > 1 && (
          <div className={styles.controls}>
            <div
              className={styles.controlsInner}
              role="group"
              aria-label="Choose a slide"
              onKeyDown={handleControlsKey}
            >
              <span className={styles.counter} aria-hidden="true">
                {String(currentSlide + 1).padStart(2, "0")}
                <i className={styles.counterRule} />
                {String(banners.length).padStart(2, "0")}
              </span>
              {banners.map((banner, index) => (
                <button
                  key={banner.id ?? index}
                  type="button"
                  ref={(el) => {
                    controlRefs.current[index] = el;
                  }}
                  className={`${styles.control} ${
                    index === currentSlide ? styles.controlActive : ""
                  }`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Show slide ${index + 1}: ${banner.title || ""}`}
                  aria-current={index === currentSlide}
                >
                  <span className={styles.controlRule} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collection openers — the index line under the hero. Replaces the old
          category circles; same data source, same categoryParam() links. */}
      {openers.length > 0 && (
        <nav className={styles.openers} aria-label="Shop by collection">
          <div className={styles.openersInner}>
            <span className={styles.openersLabel} aria-hidden="true">
              Collections
            </span>
            <ul className={styles.openersList}>
              {openers.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/products?category=${categoryParam(category)}`}
                    className={styles.openerLink}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </section>
  );
};

export default HeroSection;
