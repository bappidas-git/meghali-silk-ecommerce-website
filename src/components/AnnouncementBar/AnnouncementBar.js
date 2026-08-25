import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { FREE_SHIPPING_THRESHOLD, DEFAULT_CURRENCY } from "../../utils/constants";
import styles from "./AnnouncementBar.module.css";

/**
 * AnnouncementBar — the storefront's utility hairline, pinned above the masthead.
 *
 * ONE calm treatment: a slim ivory-on-ink band carrying a single line of small,
 * tracked uppercase copy. It replaces the old three-gradient promo bar — the
 * `--sf-gradient-announce-*` tokens still exist for any component that wants
 * them, but this bar no longer paints a different background per message.
 *
 * Messages crossfade (opacity only — no travel, no colour change), pause on
 * hover/focus, and hold on the first message when the user prefers reduced
 * motion. Dismissible, with the choice persisted in localStorage.
 *
 * It renders in normal flow, ABOVE the sticky <header>, so it scrolls away and
 * the pinned masthead + nav stay inside their ~120px budget.
 *
 * Presentation only — no fetch, no shipping logic. Copy is store-attested: the
 * shipping figure reads from FREE_SHIPPING_THRESHOLD (the same constant the cart
 * drawer's progress bar uses) so the two can never drift apart.
 */
const shippingThreshold = `${DEFAULT_CURRENCY.symbol}${FREE_SHIPPING_THRESHOLD.toLocaleString(
  "en-IN"
)}`;

// Kept short on purpose: set in tracked uppercase these have to survive a 375px
// band without ellipsising, and a caption reads more editorial than a sentence.
const ANNOUNCEMENTS = [
  { id: "shipping", text: `Complimentary shipping above ${shippingThreshold}` },
  { id: "giftwrap", text: "Complimentary gift wrapping" },
  { id: "origin", text: "Handwoven in Sualkuchi, Assam" },
];

const STORAGE_KEY = "sf_announcement_dismissed";
const ROTATE_MS = 6000;

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
  const [hidden, setHidden] = useState(false);
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

  // Hold while the tab is in the background. Browsers suspend rAF there, so a
  // rotation started off-screen would queue an exit animation that can never
  // finish — leaving every message stacked in the DOM until the tab returns.
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // Auto-rotate, unless paused, off-screen, reduced-motion, dismissed, or a
  // single message.
  useEffect(() => {
    if (paused || hidden || reduceMotion || dismissed || list.length <= 1) {
      return undefined;
    }
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, ROTATE_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, hidden, reduceMotion, dismissed, list.length]);

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
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.inner}>
        {/* Both messages share the cell during the crossfade, so the bar height
            never twitches as one replaces the other. */}
        <div className={styles.messageWrap}>
          {animate ? (
            <AnimatePresence initial={false}>
              <motion.span
                key={active.id}
                className={styles.message}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
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
