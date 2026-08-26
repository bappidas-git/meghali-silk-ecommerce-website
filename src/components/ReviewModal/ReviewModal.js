import React, { useState, useEffect, useRef } from "react";
import { onImageError, PLACEHOLDER_IMG } from "../../utils/helpers";
import styles from "./ReviewModal.module.css";

/* Tab-cycling needs the dialog's own focusables; queried broadly, then filtered
   to what is actually tabbable and on screen. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]",
].join(",");

const TITLE_MAX = 80;
const BODY_MAX = 1000;

// The score in words — the rating is never carried by the gold alone.
const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const StarGlyph = ({ filled }) =>
  filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <polygon points="12 2.6 14.9 9 21.6 9.6 16.5 14.1 18 20.8 12 17.3 6 20.8 7.5 14.1 2.4 9.6 9.1 9" />
    </svg>
  ) : (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polygon points="12 2.6 14.9 9 21.6 9.6 16.5 14.1 18 20.8 12 17.3 6 20.8 7.5 14.1 2.4 9.6 9.1 9" />
    </svg>
  );

// Interactive 1–5 star picker with hover preview.
const StarInput = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={styles.ratingRow}>
      <div className={styles.starInput} role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((s) => {
          const active = shown >= s;
          return (
            <button
              key={s}
              type="button"
              className={`${styles.starBtn} ${active ? styles.starActive : ""}`}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(s)}
              aria-label={`${s} star${s > 1 ? "s" : ""}`}
              aria-checked={value === s}
              role="radio"
            >
              <StarGlyph filled={active} />
            </button>
          );
        })}
      </div>
      <span className={`${styles.ratingWord} ${shown ? "" : styles.ratingWordEmpty}`}>
        {shown ? RATING_WORDS[shown] : "Tap a star"}
      </span>
    </div>
  );
};

// Rate / review (or edit an existing review for) a purchased product. Used from
// Order History — eligibility (purchase-gated, kept order) is decided by the
// caller; this is purely the form. Submitting (or editing) (re)enters the
// pending state for admin moderation, which the dialog states outright.
const ReviewModal = ({ open, onClose, product, existing, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Focus-trap refs: the dialog to constrain Tab within, and the element that
  // had focus before opening so we can restore it on close (a11y).
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      setRating(existing?.rating || 0);
      setTitle(existing?.title || "");
      setBody(existing?.body || "");
      setError("");
    }
  }, [open, existing]);

  // Lock the page behind the sheet while it is open.
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes, as it does on every other dialog on the storefront.
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus trap: on open, move focus into the dialog and keep Tab/Shift+Tab
  // cycling within it; on close, return focus to whatever opened it.
  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const getFocusable = () =>
      Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) =>
          el.tabIndex >= 0 &&
          (el.offsetParent !== null || el === document.activeElement)
      );

    // Focus moves in straight away — the dialog renders nothing until `open`,
    // so by the time this effect runs its nodes are already committed and
    // there is no frame to wait for.
    const focusables = getFocusable();
    if (focusables[0]) focusables[0].focus();

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusable();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !dialog.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !dialog.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleTab);
    return () => {
      dialog.removeEventListener("keydown", handleTab);
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!rating) {
      setError("Choose a star rating to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ rating, title: title.trim(), body: body.trim() });
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        ref={dialogRef}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className={styles.eyebrow}>{existing ? "Edit your review" : "Write a review"}</p>
        <h3 className={styles.heading} id="review-modal-title">
          Share your thoughts
        </h3>

        <div className={styles.productRow}>
          <span className={styles.productThumb}>
            <img
              src={product?.image || PLACEHOLDER_IMG}
              alt={product?.name || "Product"}
              onError={onImageError}
            />
          </span>
          <span className={styles.productName}>{product?.name}</span>
        </div>

        {existing && (
          <p className={styles.editNote}>
            Editing sends your review back for approval before it shows on the
            product page again.
          </p>
        )}

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <span className={styles.label} id="review-rating-label">
              Your rating *
            </span>
          </div>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor="review-title">
              Title
            </label>
            <span className={styles.counter}>
              {title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            id="review-title"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum it up in a line"
            maxLength={TITLE_MAX}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor="review-body">
              Review
            </label>
            <span className={styles.counter}>
              {body.length}/{BODY_MAX}
            </span>
          </div>
          <textarea
            id="review-body"
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="How does the weave feel? How true is the colour? What would you tell a friend?"
            rows={4}
            maxLength={BODY_MAX}
          />
        </div>

        <p className={styles.moderationNote}>
          Reviews are read before they are published — yours will appear on the
          product page after approval.
        </p>

        {error && (
          <p className={styles.error} role="alert">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="13" />
              <line x1="12" y1="16.5" x2="12" y2="16.5" />
            </svg>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <span className={styles.btnSpinner} aria-hidden="true" />}
            {submitting ? "Submitting…" : existing ? "Update review" : "Submit review"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
