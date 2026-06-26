import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import styles from "./AnnouncementBar.module.css";

/**
 * AnnouncementBar — slim, full-width gradient promo bar pinned at the very top.
 *
 * Cycles through three owner-attested promo messages every ~4s, each painted
 * with its matching brand gradient. Pauses on hover/focus and when the user
 * prefers reduced motion (then shows the first message statically). Dismissible,
 * with the choice persisted in localStorage.
 *
 * Presentation only — no fetch, no shipping logic. The promo ₹ figures here are
 * marketing copy and are intentionally decoupled from FREE_SHIPPING_THRESHOLD.
 */
const ANNOUNCEMENTS = [
  {
    id: "flash",
    text: "Flash Sale — Extra 25% Off on the Premium Collection",
    gradient: "var(--sf-gradient-announce-1)",
  },
  {
    id: "shipping",
    text: "Free Shipping on Orders Above ₹1,999",
    gradient: "var(--sf-gradient-announce-2)",
  },
  {
    id: "giftwrap",
    text: "Complimentary Gift Wrapping on All Orders",
    gradient: "var(--sf-gradient-announce-3)",
  },
];

const STORAGE_KEY = "sf_announcement_dismissed";
const ROTATE_MS = 4000;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const AnnouncementBar = ({ messages = ANNOUNCEMENTS, className = "" }) => {
  const list = messages && messages.length ? messages : ANNOUNCEMENTS;

  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timerRef = useRef(null);

  // On mount, respect a persisted dismissal.
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
    } catch (e) {
      /* localStorage may be unavailable (private mode) — fail open. */
    }
  }, []);

  // Track the reduced-motion preference (and updates to it).
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  // Auto-rotate, unless paused, reduced-motion, dismissed, or a single message.
  useEffect(() => {
    if (paused || reduceMotion || dismissed || list.length <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, ROTATE_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, reduceMotion, dismissed, list.length]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {
      /* ignore persistence failures */
    }
  }, []);

  if (dismissed) return null;

  const active = list[index % list.length];
  const animate = !reduceMotion && !prefersReducedMotion();

  return (
    <div
      className={`${styles.bar} ${className}`.trim()}
      style={{ background: active.gradient }}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.inner}>
        <Icon icon="mdi:tag-heart-outline" className={styles.icon} aria-hidden="true" />

        <div className={styles.messageWrap}>
          {animate ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={active.id}
                className={styles.message}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {active.text}
              </motion.span>
            </AnimatePresence>
          ) : (
            <span className={styles.message}>{active.text}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        className={styles.close}
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
      >
        <Icon icon="mdi:close" aria-hidden="true" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
