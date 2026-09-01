import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import apiService from "../../services/api";
import { categoryParam, resolveCategory } from "../../utils/categories";
import { onImageError } from "../../utils/helpers";
import {
  DEFAULT_HERO_EYEBROW,
  HERO_FALLBACK_SLIDES,
  heroSlideDuration,
  heroSlideOverlay,
  heroStageVars,
  normalizeHeroConfig,
  normalizeHeroSlides,
} from "../../utils/heroConfig";
import styles from "./HeroSection.module.css";

/**
 * HeroSection — the storefront's cinematic opening, fully admin-managed.
 *
 * A full-bleed media stage (one layer per slide) carrying an editorial copy
 * block: tracked eyebrow, large serif headline, one quiet line, one gold CTA +
 * one hairline CTA. Under it, a hairline index row of tracked collection links.
 *
 * NOTHING HERE IS HARDCODED
 *   Every slide (copy, CTAs, background gradient/image/video, alignment, scrim,
 *   timer, order, on/off) and every section-wide behaviour (autoplay, default
 *   timer, transition, which chrome shows, scrim strength, stage height per
 *   device, secondary CTA, the collection openers row) is edited in
 *   Admin → Storefront → Hero Section and read back here.
 *
 * DATA
 *   • apiService.hero.getConfig()    → the `heroConfig` singleton
 *   • apiService.banners.getAll()    → the slides, falling back to
 *     HERO_FALLBACK_SLIDES only if the API is unreachable
 *   • apiService.categories.getAll() → the collection openers (top-level,
 *     active, in the admin's sortOrder) and the category-derived eyebrow
 *
 * MOTION
 *   The transition is CSS (opacity or transform), not a JS animation, so the
 *   active slide is painted at full strength on the first frame and the hero
 *   never depends on a timeline to be legible. Autoplay pauses on hover AND on
 *   focus (when the admin leaves pause-on-hover on) and is disabled outright
 *   under prefers-reduced-motion, which also zeroes the transition, stops
 *   background video and hides the progress bar — leaving a static first slide.
 */

// Pull the `?category=` token out of a slide link so the eyebrow can name the
// collection it opens onto (slide links are relative app paths).
const categorySlugFromLink = (link) => {
  if (!link || !link.includes("?")) return "";
  return new URLSearchParams(link.split("?")[1]).get("category") || "";
};

const HeroSection = () => {
  const prefersReducedMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [rawSlides, setRawSlides] = useState(HERO_FALLBACK_SLIDES);
  const [rawConfig, setRawConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const controlRefs = useRef([]);
  const videoRefs = useRef({});

  // Fetch the section config. Until it lands we render against the designed
  // defaults rather than nothing at all — the hero is the LCP element, so it
  // must paint on the first frame instead of waiting on a round trip.
  useEffect(() => {
    let alive = true;
    apiService.hero
      .getConfig()
      .then((data) => {
        if (alive && data && typeof data === "object") setRawConfig(data);
      })
      .catch(() => {
        // Normalized defaults already cover this.
      });
    return () => {
      alive = false;
    };
  }, []);

  // Fetch the slides, falling back to the branded default if the API is down.
  useEffect(() => {
    let alive = true;
    const fetchSlides = async () => {
      try {
        const data = await apiService.banners.getAll();
        if (alive && Array.isArray(data) && data.length > 0) setRawSlides(data);
      } catch {
        // Use the fallback slide silently.
      }
    };
    fetchSlides();
    return () => {
      alive = false;
    };
  }, []);

  // Fetch categories (the full list — the openers are derived below, and the
  // eyebrow resolves a slide's category slug against it).
  useEffect(() => {
    let alive = true;
    const fetchCategories = async () => {
      try {
        const data = await apiService.categories.getAll();
        if (alive && Array.isArray(data)) setCategories(data);
      } catch {
        console.error("Failed to load categories");
      }
    };
    fetchCategories();
    return () => {
      alive = false;
    };
  }, []);

  const config = useMemo(() => normalizeHeroConfig(rawConfig), [rawConfig]);

  // Only the admin's active slides, in the admin's order. If every slide is
  // switched off, fall back rather than render an empty stage.
  const slides = useMemo(() => {
    const active = normalizeHeroSlides(rawSlides, { activeOnly: true });
    return active.length > 0
      ? active
      : normalizeHeroSlides(HERO_FALLBACK_SLIDES, { activeOnly: true });
  }, [rawSlides]);

  // Collection openers: top-level, active, in the admin's sortOrder, capped at
  // the admin's limit.
  const openers = useMemo(
    () =>
      categories
        .filter((c) => !c.parentId && c.isActive !== false)
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            String(a.name).localeCompare(String(b.name))
        )
        .slice(0, config.openers.limit),
    [categories, config.openers.limit]
  );

  // Keep currentSlide in range if the slide list size changes (the API returns
  // a different count than the fallback, or a slide is switched off).
  useEffect(() => {
    setCurrentSlide((prev) => (prev >= slides.length ? 0 : prev));
  }, [slides.length]);

  const multiple = slides.length > 1;
  const autoplayOn =
    config.autoplay && multiple && !prefersReducedMotion && config.enabled;
  const running = autoplayOn && !isPaused;

  // ── Autoplay ───────────────────────────────────────────────────────────────
  // Each slide runs for its OWN duration (its override, else the section
  // default), so a timeout per slide replaces the old fixed interval. Pausing
  // banks the time left rather than discarding it, so the CSS progress bar
  // (which freezes with animation-play-state) and this timer resume together.
  const remainingRef = useRef(null);
  const startedAtRef = useRef(0);

  // A new slide always starts a full run. Declared BEFORE the timer effect so
  // it clears the bank before the timer reads it.
  useEffect(() => {
    remainingRef.current = null;
  }, [currentSlide]);

  useEffect(() => {
    if (!running) return undefined;
    const full = heroSlideDuration(slides[currentSlide], config);
    const ms = remainingRef.current ?? full;
    startedAtRef.current = Date.now();
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, ms);
    return () => {
      clearTimeout(timer);
      // Bank whatever is left. On an advance the effect above wipes this again
      // before the next run reads it, so only a genuine pause keeps it.
      remainingRef.current = Math.max(0, ms - (Date.now() - startedAtRef.current));
    };
  }, [running, currentSlide, slides, config]);

  const goTo = useCallback(
    (index) => {
      if (!slides.length) return;
      setCurrentSlide(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  // The slide controls: each hairline jumps to its slide, and ←/→ step through
  // them, carrying focus with the selection.
  const handleControlsKey = useCallback(
    (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next =
        e.key === "ArrowLeft"
          ? (currentSlide - 1 + slides.length) % slides.length
          : (currentSlide + 1) % slides.length;
      setCurrentSlide(next);
      controlRefs.current[next]?.focus();
    },
    [currentSlide, slides.length]
  );

  // Background video: only the active slide plays, and nothing plays under
  // prefers-reduced-motion (the poster stands in).
  useEffect(() => {
    slides.forEach((slide, index) => {
      const el = videoRefs.current[slide.id];
      if (!el) return;
      if (index === currentSlide && !prefersReducedMotion) {
        const played = el.play?.();
        // Autoplay can still be refused (power saving, iOS Low Power Mode) —
        // the poster/first frame remains, so there is nothing to recover from.
        if (played?.catch) played.catch(() => {});
      } else {
        el.pause?.();
      }
    });
  }, [currentSlide, slides, prefersReducedMotion]);

  // Memoised because the `|| {}` tail would otherwise mint a fresh object every
  // render, and stageStyle below depends on this identity.
  const activeSlide = useMemo(
    () => slides[currentSlide] || slides[0] || {},
    [slides, currentSlide]
  );
  const activeCategory = resolveCategory(
    categorySlugFromLink(activeSlide.link),
    categories
  );
  // The admin's own eyebrow wins; otherwise the collection the slide opens onto,
  // and the store name as the last resort.
  const eyebrow =
    activeSlide.eyebrow || activeCategory?.name || DEFAULT_HERO_EYEBROW;

  // Per-slide secondary CTA overrides the section-wide one. A slide that names
  // only a label keeps the shared link (and vice versa).
  const secondary = config.secondaryCta;
  const secondaryLabel = activeSlide.secondaryCtaLabel || secondary.label;
  const secondaryLink = activeSlide.secondaryCtaLink || secondary.link;
  const showSecondary = secondary.enabled && !!secondaryLabel;

  const align = activeSlide.textAlign || "left";
  const alignClass =
    align === "center"
      ? styles.alignCenter
      : align === "right"
      ? styles.alignRight
      : styles.alignLeft;

  const stageStyle = useMemo(
    () => ({
      ...heroStageVars(config),
      "--sf-hero-scrim": heroSlideOverlay(activeSlide, config) / 100,
    }),
    [config, activeSlide]
  );

  const transition = prefersReducedMotion ? "none" : config.transition;
  const modeClass =
    transition === "slide"
      ? styles.modeSlide
      : transition === "none"
      ? styles.modeNone
      : styles.modeFade;

  // In slide mode a layer sits at (its index − the active index) stage-widths
  // across, taking the SHORT way round the loop so the wrap never rewinds the
  // whole stack. Only the neighbours are on screen, so anything further out
  // snaps into place instead of animating across (see .slideNear in the CSS).
  const offsetFor = (index) => {
    const n = slides.length;
    let offset = index - currentSlide;
    if (offset > n / 2) offset -= n;
    if (offset < -n / 2) offset += n;
    return offset;
  };

  const showChrome = multiple && config.showControls;
  const showProgress =
    config.showProgress && autoplayOn && !prefersReducedMotion;

  // The master switch. The stage is gone and the page starts at its first
  // content section — but the hero's headline was the home page's only h1, so
  // a visually-hidden one takes its place rather than leaving the document with
  // no top-level heading for a screen reader to land on.
  if (!config.enabled) {
    return <h1 className={styles.srOnly}>{DEFAULT_HERO_EYEBROW}</h1>;
  }

  const pauseHandlers = config.pauseOnHover
    ? {
        onMouseEnter: () => setIsPaused(true),
        onMouseLeave: () => setIsPaused(false),
      }
    : {};

  return (
    <section
      className={styles.hero}
      style={stageStyle}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div
        className={`${styles.stage} ${modeClass}`}
        {...pauseHandlers}
        // Focus always pauses, regardless of the hover setting: a keyboard user
        // reading the copy must never have it swapped out from under them.
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {/* Media stack — decorative, one layer per slide. The copy is NOT
            stacked: it renders once, below, so the page keeps a single h1 and
            no off-screen CTA can be tabbed into. */}
        <div className={styles.media} aria-hidden="true">
          {slides.map((slide, index) => {
            const offset = offsetFor(index);
            return (
              <div
                key={slide.id ?? index}
                className={[
                  styles.slide,
                  index === currentSlide ? styles.slideActive : "",
                  Math.abs(offset) <= 1 ? styles.slideNear : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ "--sf-slide-offset": offset }}
              >
                {/* The gradient is always the ground: it backs an image while
                    it loads and shows through a video's letterboxing. */}
                <div
                  className={styles.slideGround}
                  style={slide.gradient ? { background: slide.gradient } : undefined}
                />

                {slide.backgroundType === "video" && slide.videoUrl && (
                  <video
                    className={styles.slideVideo}
                    ref={(el) => {
                      if (el) {
                        // `muted` must be set as a property, not an attribute,
                        // or browsers refuse to autoplay.
                        el.muted = true;
                        videoRefs.current[slide.id] = el;
                      } else {
                        delete videoRefs.current[slide.id];
                      }
                    }}
                    src={slide.videoUrl}
                    poster={slide.videoPoster || undefined}
                    style={{ objectPosition: slide.imagePosition }}
                    // Under reduced motion the poster stands in for the video,
                    // so there is no reason to pull the file at all.
                    preload={prefersReducedMotion ? "none" : "auto"}
                    autoPlay={!prefersReducedMotion}
                    loop
                    playsInline
                    disablePictureInPicture
                  />
                )}

                {slide.backgroundType === "image" && slide.image && (
                  <img
                    className={styles.slideImage}
                    src={slide.image}
                    alt=""
                    style={{ objectPosition: slide.imagePosition }}
                    // The first slide is the largest thing above the fold —
                    // paint it eagerly at high priority; the rest can wait.
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchpriority={index === 0 ? "high" : "low"}
                    decoding="async"
                    onError={onImageError}
                  />
                )}

                <div className={styles.weave} />
              </div>
            );
          })}
          <div className={`${styles.scrim} ${alignClass}`} />
        </div>

        {/* Copy — one block, updated in place as the media changes. */}
        <div className={`${styles.copy} ${alignClass}`}>
          <div
            className={styles.copyInner}
            aria-live={!running ? "polite" : "off"}
          >
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}

            <h1 className={styles.headline}>{activeSlide.title}</h1>

            {activeSlide.subtitle && (
              <p className={styles.lede}>{activeSlide.subtitle}</p>
            )}

            {(activeSlide.cta || showSecondary) && (
              <div className={styles.actions}>
                {activeSlide.cta && (
                  <Link
                    to={activeSlide.link || "/products"}
                    className={`sf-btn sf-btn--gold sf-btn--lg ${styles.ctaPrimary}`}
                  >
                    {activeSlide.cta}
                  </Link>
                )}
                {showSecondary && (
                  <Link
                    to={secondaryLink || "/about"}
                    className={`sf-btn sf-btn--lg ${styles.ctaGhost}`}
                  >
                    {secondaryLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Optional prev/next arrows — off by default; the hairlines below
            carry the affordance unless an admin asks for arrows too. */}
        {multiple && config.showArrows && (
          <div className={styles.arrows}>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={() => goTo(currentSlide - 1)}
              aria-label="Previous slide"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M15 4 7 12l8 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={() => goTo(currentSlide + 1)}
              aria-label="Next slide"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M9 4l8 8-8 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Slide controls — hairlines, not dots. Keyboard: Tab to reach, ←/→
            to step. Each piece is independently switchable from the admin. */}
        {showChrome && (
          <div className={styles.controls}>
            <div
              className={styles.controlsInner}
              role="group"
              aria-label="Choose a slide"
              onKeyDown={handleControlsKey}
            >
              {config.showCounter && (
                <span className={styles.counter} aria-hidden="true">
                  {String(currentSlide + 1).padStart(2, "0")}
                  <i className={styles.counterRule} />
                  {String(slides.length).padStart(2, "0")}
                </span>
              )}
              {slides.map((slide, index) => (
                <button
                  key={slide.id ?? index}
                  type="button"
                  ref={(el) => {
                    controlRefs.current[index] = el;
                  }}
                  className={`${styles.control} ${
                    index === currentSlide ? styles.controlActive : ""
                  }`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Show slide ${index + 1}: ${slide.title || ""}`}
                  aria-current={index === currentSlide}
                >
                  <span className={styles.controlRule} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Autoplay progress — a hairline across the stage floor, running for
            exactly this slide's duration. It freezes on pause, in step with
            the timer above, and remounts (restarts) on every slide change. */}
        {showProgress && (
          <div className={styles.progress} aria-hidden="true">
            <span
              key={`${currentSlide}-${slides.length}`}
              className={styles.progressBar}
              style={{
                animationDuration: `${heroSlideDuration(activeSlide, config)}ms`,
                animationPlayState: isPaused ? "paused" : "running",
              }}
            />
          </div>
        )}
      </div>

      {/* Collection openers — the index line under the hero. Label and length
          are the admin's; the links are the live category tree. */}
      {config.openers.enabled && openers.length > 0 && (
        <nav className={styles.openers} aria-label="Shop by collection">
          <div className={styles.openersInner}>
            {config.openers.label && (
              <span className={styles.openersLabel} aria-hidden="true">
                {config.openers.label}
              </span>
            )}
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
