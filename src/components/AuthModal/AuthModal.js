import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { isEmailValid } from "../../utils/helpers";
import {
  DURATION,
  INSTANT,
  RISE,
  overlay,
  panel,
  sheet,
  t,
  tween,
} from "../../theme/motion";
import styles from "./AuthModal.module.css";

/* Both wordmarks are gold/white on a TRANSPARENT ground, so they sit straight
   on the dialog's ivory — the old deep-green logo plate is retired. The light
   art is the byte-for-byte URL the masthead and SidebarMenu use, so opening the
   dialog paints it from cache; the white art is its dark-mode twin.
   Intrinsic 1454×454. */
const LOGO_LIGHT =
  "https://res.cloudinary.com/v8vrixwq/image/upload/f_auto,q_auto,w_520/v1787592407/meghali-silk-logo.png";
const LOGO_WHITE =
  "https://res.cloudinary.com/v8vrixwq/image/upload/f_auto,q_auto,w_520/v1787592405/meghali-silk-logo-white.png";
const LOGO_W = 520;
const LOGO_H = 162;

/* How far the tab panes travel as they swap. Shorter than the old ±60px: the
   pane is answering a click on a tab six pixels away, not arriving from
   off-screen. */
const PANE_TRAVEL = 32;

/* Tab-cycling needs the dialog's own focusables. Queried broadly and then
   filtered by tabIndex, because the tablist uses a roving tabindex — a
   `button` selector alone would count the inactive tab, which is not tabbable
   and would break the wrap-around maths. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]",
].join(",");

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                          */
/* ------------------------------------------------------------------ */

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* The five social-brand hexes below are the one documented exception to the
   tokens-only rule: a provider mark is not ours to re-colour. */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true" focusable="false">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={styles.spinner} aria-hidden="true" focusable="false">
    <path d="M12 2a10 10 0 010 20" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Password strength helper                                           */
/* ------------------------------------------------------------------ */

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "var(--auth-strength-weak)" };
  if (score <= 2) return { score: 2, label: "Fair", color: "var(--auth-strength-fair)" };
  if (score <= 3) return { score: 3, label: "Good", color: "var(--auth-strength-good)" };
  return { score: 4, label: "Strong", color: "var(--auth-strength-strong)" };
}

/* Joins the ids a control is described by, dropping the ones that aren't
   rendered. Returns undefined (not "") so React omits the attribute. */
const describedBy = (...ids) => ids.filter(Boolean).join(" ") || undefined;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const AuthModal = ({ open, onClose, defaultTab = "login" }) => {
  const { login, register, isLoading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const reduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [direction, setDirection] = useState(0);

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup state
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Shared state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);

  // Focus-trap refs: the dialog to constrain Tab within, and the element that
  // had focus before opening so we can restore it on close (a11y).
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  // The tablist uses a roving tabindex, so arrow keys have to move focus by hand.
  const loginTabRef = useRef(null);
  const signupTabRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Honour defaultTab on every open, not just when the prop changes: a caller
  // asking for "login" has to land on Sign in even if the last visit to the
  // dialog ended on Create account. Also re-runs if defaultTab changes while
  // the dialog is already open.
  useEffect(() => {
    if (!open) return;
    setActiveTab(defaultTab);
    setDirection(0);
    setErrors({});
    setSuccessMessage("");
    setInfoMessage("");
  }, [open, defaultTab]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus trap: on open, move focus into the dialog and keep Tab/Shift+Tab
  // cycling within it; on close, return focus to whatever opened the modal.
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const getFocusable = () =>
      Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) =>
          el.tabIndex >= 0 &&
          (el.offsetParent !== null || el === document.activeElement)
      );

    // Move focus to the first focusable control once the dialog has mounted.
    const focusTimer = window.requestAnimationFrame(() => {
      const focusables = getFocusable();
      if (focusables[0]) focusables[0].focus();
    });

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
      window.cancelAnimationFrame(focusTimer);
      dialog.removeEventListener("keydown", handleTab);
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open]);

  /* ---- Tab switching ---- */

  const switchTab = (tab) => {
    if (tab === activeTab) return;
    setDirection(tab === "signup" ? 1 : -1);
    setActiveTab(tab);
    setErrors({});
    setSuccessMessage("");
    setInfoMessage("");
  };

  // Arrow/Home/End move between the two tabs, per the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (e) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let next;
    if (e.key === "Home") next = "login";
    else if (e.key === "End") next = "signup";
    else next = activeTab === "login" ? "signup" : "login";
    switchTab(next);
    const node = next === "login" ? loginTabRef.current : signupTabRef.current;
    if (node) node.focus();
  };

  // Self-service password reset isn't built yet — say so instead of doing
  // nothing, and point at the support page (the manual path that exists).
  const handleForgotPassword = () => {
    setErrors({});
    setInfoMessage("Password reset isn't available yet. Our support team can help you regain access.");
  };

  /* ---- Handlers: Login ---- */

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateLogin = () => {
    const errs = {};
    if (!loginData.email.trim()) {
      errs.email = "Email is required";
    } else if (!isEmailValid(loginData.email)) {
      errs.email = "Enter a valid email address";
    }
    if (!loginData.password) {
      errs.password = "Password is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsSubmitting(true);
    setErrors({});
    setInfoMessage("");
    try {
      // login() resolves with { success, error } instead of throwing — check
      // it, or failed logins would show the success state and close the modal.
      const result = await login({
        email: loginData.email,
        password: loginData.password,
        remember: rememberMe,
      });
      if (!result.success) {
        setErrors({ general: result.error || "Login failed. Please try again." });
        return;
      }
      setSuccessMessage("Welcome back! Signing you in...");
      setTimeout(() => {
        onClose();
        setSuccessMessage("");
        setLoginData({ email: "", password: "" });
      }, 1500);
    } catch (err) {
      setErrors({ general: err.message || "Login failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Handlers: Signup ---- */

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateSignup = () => {
    const errs = {};
    if (!signupData.firstName.trim()) errs.firstName = "First name is required";
    if (!signupData.lastName.trim()) errs.lastName = "Last name is required";
    if (!signupData.email.trim()) {
      errs.email = "Email is required";
    } else if (!isEmailValid(signupData.email)) {
      errs.email = "Enter a valid email address";
    }
    if (signupData.phone && !/^\d{10}$/.test(signupData.phone.replace(/\s/g, ""))) {
      errs.phone = "Enter a valid 10-digit phone number";
    }
    if (!signupData.password) {
      errs.password = "Password is required";
    } else if (signupData.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    if (!signupData.confirmPassword) {
      errs.confirmPassword = "Please confirm your password";
    } else if (signupData.password !== signupData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    if (!agreeTerms) {
      errs.terms = "You must accept the terms and conditions";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      // register() resolves with { success, error } instead of throwing —
      // see handleLoginSubmit.
      const result = await register({
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        phone: signupData.phone ? `+91${signupData.phone.replace(/\s/g, "")}` : "",
        password: signupData.password,
        confirmPassword: signupData.confirmPassword,
      });
      if (!result.success) {
        setErrors({ general: result.error || "Registration failed. Please try again." });
        return;
      }
      setSuccessMessage("Account created! Redirecting to login...");
      const registeredEmail = signupData.email;
      setTimeout(() => {
        switchTab("login");
        setSuccessMessage("");
        setLoginData({ email: registeredEmail, password: "" });
        setSignupData({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
        setAgreeTerms(false);
      }, 1800);
    } catch (err) {
      setErrors({ general: err.message || "Registration failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Overlay click ---- */

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* ---- Password strength (signup only) ---- */

  const passwordStrength = getPasswordStrength(signupData.password);

  /* ---- Derived ---- */

  const loading = isSubmitting || authLoading;
  const themeClass = isDarkMode ? styles.dark : styles.light;
  const isLogin = activeTab === "login";

  /* ---------------------------------------------------------------------
   * MOTION — all of it from theme/motion.js, so the dialog opens with the
   * same weight as the cart tray and the menu. On mobile it is a bottom
   * sheet (a tween now, where it used to be a spring); on desktop it rises
   * and fades. Reduced motion keeps every state change but drops the travel.
   * ------------------------------------------------------------------- */

  const scrim = overlay(reduceMotion);

  const dialogMotion = isMobile
    ? panel(reduceMotion, "bottom")
    : sheet(reduceMotion, RISE.reveal);
  const dialogVariants = {
    hidden: dialogMotion.initial,
    visible: dialogMotion.animate,
    exit: dialogMotion.exit,
  };

  // Directional pane slide — the pane follows the direction you moved along
  // the tablist, arriving on the base tier and leaving on the fast one.
  const tabContentVariants = reduceMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1, transition: INSTANT },
        exit: { opacity: 0, transition: INSTANT },
      }
    : {
        enter: (dir) => ({ x: dir > 0 ? PANE_TRAVEL : -PANE_TRAVEL, opacity: 0 }),
        center: { x: 0, opacity: 1, transition: tween(DURATION.base) },
        exit: (dir) => ({
          x: dir > 0 ? -PANE_TRAVEL : PANE_TRAVEL,
          opacity: 0,
          transition: tween(DURATION.fast),
        }),
      };

  const bannerMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: INSTANT },
        exit: { opacity: 0, transition: INSTANT },
      }
    : {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: "auto", transition: tween(DURATION.base) },
        exit: { opacity: 0, height: 0, transition: tween(DURATION.fast) },
      };

  /* ---- Render ---- */

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`${styles.overlay} ${themeClass}`}
          {...scrim}
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={dialogRef}
            className={`${styles.dialog} ${isMobile ? styles.dialogMobile : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ---- Success toast ---- */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  className={styles.successToast}
                  initial={{ opacity: 0, x: "-50%", y: reduceMotion ? 0 : -RISE.micro }}
                  animate={{
                    opacity: 1,
                    x: "-50%",
                    y: 0,
                    transition: t(reduceMotion, DURATION.base),
                  }}
                  exit={{
                    opacity: 0,
                    x: "-50%",
                    y: reduceMotion ? 0 : -RISE.micro,
                    transition: t(reduceMotion, DURATION.fast),
                  }}
                  role="status"
                >
                  <span className={styles.successIcon}><CheckIcon /></span>
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- Close mark ---- */}
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              <CloseIcon />
            </button>

            <div className={styles.body}>
              {/* ---- Masthead: the wordmark straight on the ivory ---- */}
              <div className={styles.header}>
                <img
                  className={styles.logo}
                  src={isDarkMode ? LOGO_WHITE : LOGO_LIGHT}
                  alt="Meghali's Silk"
                  width={LOGO_W}
                  height={LOGO_H}
                  loading="lazy"
                  decoding="async"
                />
                <h2 id="auth-modal-title" className={styles.title}>
                  {isLogin ? "Welcome back" : "Join Meghali's Silk"}
                </h2>
                <p className={styles.subtitle}>
                  {isLogin
                    ? "Sign in to reach your orders, your wishlist and your saved details."
                    : "Create an account to save what you love and follow every order."}
                </p>
              </div>

              {/* ---- Tabs ---- */}
              <div className={styles.tabs} role="tablist" aria-label="Account access">
                <button
                  ref={loginTabRef}
                  type="button"
                  role="tab"
                  id="auth-tab-login"
                  aria-selected={isLogin}
                  aria-controls={isLogin ? "auth-panel-login" : undefined}
                  tabIndex={isLogin ? 0 : -1}
                  className={`${styles.tab} ${isLogin ? styles.tabActive : ""}`}
                  onClick={() => switchTab("login")}
                  onKeyDown={handleTabKeyDown}
                >
                  Sign in
                </button>
                <button
                  ref={signupTabRef}
                  type="button"
                  role="tab"
                  id="auth-tab-signup"
                  aria-selected={!isLogin}
                  aria-controls={!isLogin ? "auth-panel-signup" : undefined}
                  tabIndex={!isLogin ? 0 : -1}
                  className={`${styles.tab} ${!isLogin ? styles.tabActive : ""}`}
                  onClick={() => switchTab("signup")}
                  onKeyDown={handleTabKeyDown}
                >
                  Create account
                </button>
                <motion.div
                  className={styles.tabIndicator}
                  animate={{ x: isLogin ? "0%" : "100%" }}
                  transition={t(reduceMotion, DURATION.base)}
                />
              </div>

              {/* ---- General error ---- */}
              <AnimatePresence>
                {errors.general && (
                  <motion.div className={styles.errorBanner} {...bannerMotion} role="alert">
                    <div className={styles.bannerInner}>{errors.general}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ---- Info banner ---- */}
              <AnimatePresence>
                {infoMessage && (
                  <motion.div className={styles.infoBanner} {...bannerMotion} role="status">
                    <div className={styles.bannerInner}>
                      {infoMessage}{" "}
                      <Link to="/support" className={styles.infoBannerLink} onClick={onClose}>
                        Contact support
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ---- Form content ---- */}
              <div className={styles.formWrapper}>
                <AnimatePresence custom={direction} mode="wait">
                  {isLogin ? (
                    <motion.form
                      key="login"
                      id="auth-panel-login"
                      role="tabpanel"
                      aria-labelledby="auth-tab-login"
                      custom={direction}
                      variants={tabContentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      onSubmit={handleLoginSubmit}
                      noValidate
                      className={styles.form}
                    >
                      {/* Email */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="login-email">Email</label>
                        <div className={`${styles.field} ${errors.email ? styles.fieldInvalid : ""}`}>
                          <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={loginData.email}
                            onChange={handleLoginChange}
                            className={styles.input}
                            aria-invalid={errors.email ? true : undefined}
                            aria-describedby={describedBy(errors.email && "login-email-error")}
                          />
                        </div>
                        {errors.email && (
                          <span id="login-email-error" className={styles.fieldError}>{errors.email}</span>
                        )}
                      </div>

                      {/* Password */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="login-password">Password</label>
                        <div className={`${styles.field} ${errors.password ? styles.fieldInvalid : ""}`}>
                          <input
                            id="login-password"
                            name="password"
                            type={showLoginPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={handleLoginChange}
                            className={styles.input}
                            aria-invalid={errors.password ? true : undefined}
                            aria-describedby={describedBy(errors.password && "login-password-error")}
                          />
                          <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowLoginPassword((v) => !v)}
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                            aria-pressed={showLoginPassword}
                          >
                            {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                        {errors.password && (
                          <span id="login-password-error" className={styles.fieldError}>{errors.password}</span>
                        )}
                      </div>

                      {/* Remember me + Forgot */}
                      <div className={styles.optionsRow}>
                        <label className={styles.checkLabel}>
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className={styles.checkbox}
                          />
                          <span className={styles.checkMark} />
                          Remember me
                        </label>
                        <button
                          type="button"
                          className={`${styles.linkBtn} ${styles.forgotBtn}`}
                          onClick={handleForgotPassword}
                        >
                          Forgot password?
                        </button>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className={`sf-btn sf-btn--emerald sf-btn--lg sf-btn--block ${styles.submitBtn}`}
                        disabled={loading}
                        aria-busy={loading || undefined}
                      >
                        {loading ? (
                          <>
                            <SpinnerIcon />
                            <span className={styles.srOnly}>Signing in, please wait</span>
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </button>

                      {/* Divider */}
                      <div className={styles.divider}>
                        <span className={styles.dividerLine} />
                        <span className={styles.dividerText}>or continue with</span>
                        <span className={styles.dividerLine} />
                      </div>

                      {/* Social buttons — providers not configured yet, so they
                          are disabled and badged instead of silently dead */}
                      <div className={styles.socialRow}>
                        <button
                          type="button"
                          className={`${styles.socialBtn} ${styles.socialBtnDisabled}`}
                          disabled
                          title="Google sign-in is coming soon"
                        >
                          <GoogleIcon />
                          <span>Google</span>
                          <span className={styles.soonBadge}>Soon</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.socialBtn} ${styles.socialBtnDisabled}`}
                          disabled
                          title="Facebook sign-in is coming soon"
                        >
                          <FacebookIcon />
                          <span>Facebook</span>
                          <span className={styles.soonBadge}>Soon</span>
                        </button>
                      </div>

                      {/* Switch link */}
                      <p className={styles.switchText}>
                        New to Meghali&rsquo;s Silk?{" "}
                        <button type="button" className={styles.switchBtn} onClick={() => switchTab("signup")}>
                          Create an account
                        </button>
                      </p>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="signup"
                      id="auth-panel-signup"
                      role="tabpanel"
                      aria-labelledby="auth-tab-signup"
                      custom={direction}
                      variants={tabContentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      onSubmit={handleSignupSubmit}
                      noValidate
                      className={styles.form}
                    >
                      {/* Name row */}
                      <div className={styles.nameRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label} htmlFor="signup-first">First name</label>
                          <div className={`${styles.field} ${errors.firstName ? styles.fieldInvalid : ""}`}>
                            <input
                              id="signup-first"
                              name="firstName"
                              type="text"
                              autoComplete="given-name"
                              placeholder="Anjali"
                              value={signupData.firstName}
                              onChange={handleSignupChange}
                              className={styles.input}
                              aria-invalid={errors.firstName ? true : undefined}
                              aria-describedby={describedBy(errors.firstName && "signup-first-error")}
                            />
                          </div>
                          {errors.firstName && (
                            <span id="signup-first-error" className={styles.fieldError}>{errors.firstName}</span>
                          )}
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label} htmlFor="signup-last">Last name</label>
                          <div className={`${styles.field} ${errors.lastName ? styles.fieldInvalid : ""}`}>
                            <input
                              id="signup-last"
                              name="lastName"
                              type="text"
                              autoComplete="family-name"
                              placeholder="Baruah"
                              value={signupData.lastName}
                              onChange={handleSignupChange}
                              className={styles.input}
                              aria-invalid={errors.lastName ? true : undefined}
                              aria-describedby={describedBy(errors.lastName && "signup-last-error")}
                            />
                          </div>
                          {errors.lastName && (
                            <span id="signup-last-error" className={styles.fieldError}>{errors.lastName}</span>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="signup-email">Email</label>
                        <div className={`${styles.field} ${errors.email ? styles.fieldInvalid : ""}`}>
                          <input
                            id="signup-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={signupData.email}
                            onChange={handleSignupChange}
                            className={styles.input}
                            aria-invalid={errors.email ? true : undefined}
                            aria-describedby={describedBy(errors.email && "signup-email-error")}
                          />
                        </div>
                        {errors.email && (
                          <span id="signup-email-error" className={styles.fieldError}>{errors.email}</span>
                        )}
                      </div>

                      {/* Phone */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="signup-phone">Phone (optional)</label>
                        <div className={`${styles.field} ${errors.phone ? styles.fieldInvalid : ""}`}>
                          <span className={styles.phonePrefix} aria-hidden="true">+91</span>
                          <input
                            id="signup-phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel-national"
                            placeholder="9876543210"
                            value={signupData.phone}
                            onChange={handleSignupChange}
                            className={`${styles.input} ${styles.phoneInput}`}
                            aria-invalid={errors.phone ? true : undefined}
                            aria-describedby={describedBy("signup-phone-hint", errors.phone && "signup-phone-error")}
                          />
                          <span id="signup-phone-hint" className={styles.srOnly}>
                            Indian number, country code +91, ten digits
                          </span>
                        </div>
                        {errors.phone && (
                          <span id="signup-phone-error" className={styles.fieldError}>{errors.phone}</span>
                        )}
                      </div>

                      {/* Password */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="signup-password">Password</label>
                        <div className={`${styles.field} ${errors.password ? styles.fieldInvalid : ""}`}>
                          <input
                            id="signup-password"
                            name="password"
                            type={showSignupPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Min. 6 characters"
                            value={signupData.password}
                            onChange={handleSignupChange}
                            className={styles.input}
                            aria-invalid={errors.password ? true : undefined}
                            aria-describedby={describedBy(
                              errors.password && "signup-password-error",
                              signupData.password && "signup-password-strength"
                            )}
                          />
                          <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowSignupPassword((v) => !v)}
                            aria-label={showSignupPassword ? "Hide password" : "Show password"}
                            aria-pressed={showSignupPassword}
                          >
                            {showSignupPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                        {errors.password && (
                          <span id="signup-password-error" className={styles.fieldError}>{errors.password}</span>
                        )}

                        {/* Password strength — the word carries the meaning,
                            the four rules only echo it (never colour alone) */}
                        {signupData.password && (
                          <div
                            id="signup-password-strength"
                            className={styles.strengthWrap}
                            aria-live="polite"
                          >
                            <div className={styles.strengthBar} aria-hidden="true">
                              {[1, 2, 3, 4].map((segment) => (
                                <div
                                  key={segment}
                                  className={styles.strengthSegment}
                                  style={{
                                    backgroundColor:
                                      segment <= passwordStrength.score
                                        ? passwordStrength.color
                                        : "var(--auth-strength-empty)",
                                  }}
                                />
                              ))}
                            </div>
                            <span
                              className={styles.strengthLabel}
                              style={{ color: passwordStrength.color }}
                            >
                              {passwordStrength.label ? `${passwordStrength.label} password` : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="signup-confirm">Confirm password</label>
                        <div className={`${styles.field} ${errors.confirmPassword ? styles.fieldInvalid : ""}`}>
                          <input
                            id="signup-confirm"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Re-enter password"
                            value={signupData.confirmPassword}
                            onChange={handleSignupChange}
                            className={styles.input}
                            aria-invalid={errors.confirmPassword ? true : undefined}
                            aria-describedby={describedBy(errors.confirmPassword && "signup-confirm-error")}
                          />
                          <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            aria-pressed={showConfirmPassword}
                          >
                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <span id="signup-confirm-error" className={styles.fieldError}>{errors.confirmPassword}</span>
                        )}
                      </div>

                      {/* Terms */}
                      <div className={styles.fieldGroup}>
                        <label className={`${styles.checkLabel} ${styles.termsLabel}`}>
                          <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => {
                              setAgreeTerms(e.target.checked);
                              if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
                            }}
                            className={styles.checkbox}
                            aria-invalid={errors.terms ? true : undefined}
                            aria-describedby={describedBy(errors.terms && "signup-terms-error")}
                          />
                          <span className={styles.checkMark} />
                          <span>
                            I agree to the{" "}
                            <Link
                              to="/terms"
                              target="_blank"
                              className={styles.linkBtn}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Terms &amp; Conditions
                            </Link>{" "}
                            and{" "}
                            <Link
                              to="/privacy"
                              target="_blank"
                              className={styles.linkBtn}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Privacy Policy
                            </Link>
                          </span>
                        </label>
                        {errors.terms && (
                          <span id="signup-terms-error" className={styles.fieldError}>{errors.terms}</span>
                        )}
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className={`sf-btn sf-btn--emerald sf-btn--lg sf-btn--block ${styles.submitBtn}`}
                        disabled={loading}
                        aria-busy={loading || undefined}
                      >
                        {loading ? (
                          <>
                            <SpinnerIcon />
                            <span className={styles.srOnly}>Creating your account, please wait</span>
                          </>
                        ) : (
                          "Create account"
                        )}
                      </button>

                      {/* Switch link */}
                      <p className={styles.switchText}>
                        Already have an account?{" "}
                        <button type="button" className={styles.switchBtn} onClick={() => switchTab("login")}>
                          Sign in
                        </button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
