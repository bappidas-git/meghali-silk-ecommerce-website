import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import apiService from "../../services/api";
import { categoryParam } from "../../utils/categories";
import { onImageError } from "../../utils/helpers";
import styles from "./HeroSection.module.css";

// Silk hero photo overlaid behind/beside the slide copy. Decorative only — a
// dark scrim keeps the gold headline legible, and onImageError degrades it to
// the inline placeholder so the hero never renders broken.
const SILK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=70";

// Brand fallback so the hero is never empty if the banners API is briefly
// unavailable. Real banners come from apiService.banners.getAll() (seeded in
// db.json). Uses a token-based gradient — no hardcoded hex.
const defaultBanners = [
  {
    id: "fallback-1",
    title: "Award-Winning Craftsmanship",
    subtitle: "National Handloom Award 2022",
    cta: "Shop the Collection",
    link: "/products",
    gradient: "var(--sf-gradient-heritage)",
  },
];

// Category-accent tokens cycled by index for the circle ring/glow.
const CATEGORY_ACCENTS = [
  "var(--sf-cat-pink)",
  "var(--sf-cat-purple)",
  "var(--sf-cat-orange)",
  "var(--sf-cat-blue)",
  "var(--sf-cat-teal)",
  "var(--sf-cat-red)",
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState(defaultBanners);
  const [categories, setCategories] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  // When the user prefers reduced motion, cross-fade instantly and skip the
  // scale animation; otherwise use the gentle scale/fade transition.
  const slideVariants = prefersReducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: { opacity: 0, scale: 1.05 },
        center: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      };
  const slideTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: "easeInOut" };

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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiService.categories.getAll();
        if (Array.isArray(data)) {
          // Only show top-level categories (no parentId)
          const topLevel = data.filter((c) => !c.parentId && c.isActive);
          setCategories(topLevel.slice(0, 8));
        }
      } catch {
        console.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Keep currentSlide in range if the banner list size changes (e.g. API
  // returns a different count than the defaults) so it never goes out of bounds.
  useEffect(() => {
    setCurrentSlide((prev) => (prev >= banners.length ? 0 : prev));
  }, [banners.length]);

  // Auto-slide (paused on hover; disabled when the user prefers reduced motion)
  useEffect(() => {
    if (isPaused || prefersReducedMotion || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused, prefersReducedMotion]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handleBannerClick = useCallback(
    (link) => {
      if (link) navigate(link);
    },
    [navigate]
  );

  const handleCategoryClick = useCallback(
    (category) => {
      navigate(`/products?category=${categoryParam(category)}`);
    },
    [navigate]
  );

  const activeBanner = banners[currentSlide] || {};

  return (
    <section
      className={styles.heroSection}
      data-theme={isDarkMode ? "dark" : "light"}
    >
      {/* Banner Carousel */}
      <div
        className={styles.carouselContainer}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={styles.carouselInner}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              className={styles.slide}
              style={{ background: activeBanner.gradient }}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              {/* Silk hero image + scrim (decorative, behind the copy) */}
              <div className={styles.slideMedia} aria-hidden="true">
                <img
                  className={styles.slideImage}
                  src={SILK_HERO_IMAGE}
                  alt=""
                  loading="lazy"
                  onError={onImageError}
                />
                <div className={styles.slideScrim} />
              </div>

              <div className={styles.slideContent}>
                <motion.span
                  className={styles.slideEyebrow}
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, y: -10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
                >
                  {activeBanner.subtitle || "Heritage Handloom Silk"}
                </motion.span>

                <motion.h2
                  className={styles.slideTitle}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.1 }}
                >
                  {activeBanner.title}
                </motion.h2>

                <motion.p
                  className={styles.slideSubtitle}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
                >
                  Excellence in Royal Silk, woven by master artisans of Bengal.
                </motion.p>

                {/* Round gold emblem badge — award/heritage motif */}
                <motion.div
                  className={styles.emblem}
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.25 }}
                  aria-hidden="true"
                >
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="5" />
                    <path d="M12 5.5l.9 1.8 2 .3-1.45 1.4.34 2L12 11.3l-1.8.95.34-2L9.1 8.9l2-.3z" />
                    <path d="M8.5 12.5L7 21l5-3 5 3-1.5-8.5" />
                  </svg>
                </motion.div>

                <motion.div
                  className={styles.ctaRow}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
                >
                  <button
                    className={styles.ctaPrimary}
                    onClick={() => handleBannerClick(activeBanner.link)}
                  >
                    {activeBanner.cta || "Shop the Collection"}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    className={styles.ctaSecondary}
                    onClick={() => navigate("/about")}
                  >
                    Our Story
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arrow Navigation */}
          <button
            className={`${styles.arrowBtn} ${styles.arrowLeft}`}
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            className={`${styles.arrowBtn} ${styles.arrowRight}`}
            onClick={goToNext}
            aria-label="Next slide"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Dot Navigation */}
          <div className={styles.dotsContainer}>
            {banners.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${
                  index === currentSlide ? styles.dotActive : ""
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentSlide}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Category Quick Links — colorful circles */}
      {categories.length > 0 && (
        <motion.div
          className={styles.categoryBar}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.5, duration: 0.5 }}
        >
          <div className={styles.categoryScroll}>
            {categories.map((category, index) => {
              const accent = CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length];
              return (
                <button
                  key={category.id}
                  type="button"
                  className={styles.categoryItem}
                  style={{ "--cat-accent": accent }}
                  onClick={() => handleCategoryClick(category)}
                  aria-label={`Shop ${category.name}`}
                >
                  <span className={styles.categoryCircle}>
                    {category.image ? (
                      <img
                        className={styles.categoryImage}
                        src={category.image}
                        alt=""
                        loading="lazy"
                        onError={onImageError}
                      />
                    ) : (
                      <span className={styles.categoryInitial} aria-hidden="true">
                        {category.name?.charAt(0) || "•"}
                      </span>
                    )}
                  </span>
                  <span className={styles.categoryLabel}>{category.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default HeroSection;
