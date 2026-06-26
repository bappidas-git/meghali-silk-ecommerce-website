// =============================================================================
// Contact Us page — Meghali's Silk storefront, route `/support`.
// =============================================================================
// This is the storefront Contact Us page on route `/support` (the dark,
// gold-on-green "Let's Start a Conversation" experience). It posts a real lead
// via apiService.leads.createContact. The separate `/help` route is the Help
// Center (FAQ / ticket-style help) and is NOT this page.
// =============================================================================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_ADDRESS,
  SUPPORT_HOURS,
  SOCIAL_LINKS,
  WHY_CHOOSE_US,
} from "../../utils/constants";
import { isEmailValid, isValidPhone } from "../../utils/helpers";
import styles from "./Support.module.css";

// Static, brand-attested figures — NOT live counters or API-derived metrics.
const STATS = [
  { icon: "mdi:star", number: "4.9", label: "Rating" },
  { icon: "mdi:account-group", number: "10K+", label: "Customers" },
  { icon: "mdi:palette-swatch", number: "500+", label: "Designs" },
  { icon: "mdi:calendar-clock", number: "15+", label: "Years" },
];

// Contact cards — each value is a real tel:/mailto:/WhatsApp link.
const PHONE_TEL = `tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`;
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  SUPPORT_ADDRESS
)}`;

// Follow Our Journey — render only non-empty channels (no dead links).
const SOCIALS = [
  { key: "INSTAGRAM", icon: "mdi:instagram", label: "Instagram" },
  { key: "FACEBOOK", icon: "mdi:facebook", label: "Facebook" },
  { key: "TWITTER", icon: "mdi:twitter", label: "Twitter" },
  { key: "YOUTUBE", icon: "mdi:youtube", label: "YouTube" },
  { key: "WHATSAPP", icon: "mdi:whatsapp", label: "WhatsApp" },
].filter((s) => SOCIAL_LINKS[s.key]);

// Shared subtle reveal — respects reduced-motion via tokens.
const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5 },
};

const Support = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  // Keep the full lead shape so the POST stays compatible with seeded `leads`
  // rows (category/orderNumber are sent but hidden from the visible form set).
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", orderNumber: "",
    category: "general", subject: "", message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Pre-fill the email for logged-in users once the auth context resolves,
  // without clobbering anything they may have already typed.
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => (prev.email ? prev : { ...prev, email: user.email }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!isEmailValid(formData.email)) newErrors.email = "Invalid email";
    if (formData.phone.trim() && !isValidPhone(formData.phone))
      newErrors.phone = "Enter a valid 10-digit mobile number";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    else if (formData.message.trim().length < 20)
      newErrors.message = "At least 20 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await apiService.leads.createContact(formData);
      setIsSubmitted(true);
      setFormData({
        name: "", email: "", phone: "", orderNumber: "",
        category: "general", subject: "", message: "",
      });
    } catch {
      setErrors({ submit: "Failed to send. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
        <motion.div
          className={styles.successCard}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <span className={styles.successIcon} aria-hidden="true">
            <Icon icon="mdi:check-bold" />
          </span>
          <h2>Message Sent!</h2>
          <p>Thank you for reaching out. We'll respond within 24 hours.</p>
          <button
            type="button"
            className={styles.successBtn}
            onClick={() => setIsSubmitted(false)}
          >
            Send Another
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link> <span aria-hidden="true">/</span>{" "}
        <span>Contact Us</span>
      </div>

      {/* 1. Intro block */}
      <motion.section
        className={styles.intro}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className={styles.pill}>
          <Icon icon="mdi:headset" aria-hidden="true" />
          We're here to Help
        </span>
        <h1 className={styles.title}>
          Let's Start a <span className={styles.titleAccent}>Conversation</span>
        </h1>
        <p className={styles.subtitle}>
          Whether you're looking for the perfect silk saree or need expert
          guidance, our team is ready to assist you.
        </p>

        {/* 2. Stats row — static brand-attested figures */}
        <ul className={styles.statsRow}>
          {STATS.map((stat) => (
            <li key={stat.label} className={styles.stat}>
              <Icon className={styles.statIcon} icon={stat.icon} aria-hidden="true" />
              <span className={styles.statNumber}>{stat.number}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* 3. Contact cards */}
      <motion.section className={styles.cards} {...reveal}>
        <a className={styles.card} href={PHONE_TEL}>
          <span className={`${styles.cardIcon} ${styles.iconEmerald}`} aria-hidden="true">
            <Icon icon="mdi:phone" />
          </span>
          <h2 className={styles.cardTitle}>Call Us</h2>
          <span className={styles.cardValue}>{SUPPORT_PHONE}</span>
          <span className={styles.cardCaption}>
            Speak directly with our silk experts
          </span>
        </a>

        <a className={styles.card} href={`mailto:${SUPPORT_EMAIL}`}>
          <span className={`${styles.cardIcon} ${styles.iconPink}`} aria-hidden="true">
            <Icon icon="mdi:email-outline" />
          </span>
          <h2 className={styles.cardTitle}>Email Us</h2>
          <span className={styles.cardValue}>{SUPPORT_EMAIL}</span>
          <span className={styles.cardCaption}>
            Detailed answers to your queries
          </span>
        </a>

        {SOCIAL_LINKS.WHATSAPP ? (
          <a
            className={styles.card}
            href={SOCIAL_LINKS.WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={`${styles.cardIcon} ${styles.iconEmerald}`} aria-hidden="true">
              <Icon icon="mdi:whatsapp" />
            </span>
            <h2 className={styles.cardTitle}>WhatsApp</h2>
            <span className={styles.cardValue}>Chat with us</span>
            <span className={styles.cardCaption}>
              Quick chat support available
            </span>
          </a>
        ) : (
          <div className={styles.card}>
            <span className={`${styles.cardIcon} ${styles.iconEmerald}`} aria-hidden="true">
              <Icon icon="mdi:whatsapp" />
            </span>
            <h2 className={styles.cardTitle}>WhatsApp</h2>
            <span className={styles.cardCaption}>
              Quick chat support available
            </span>
          </div>
        )}
      </motion.section>

      {/* 4. Two-column body */}
      <div className={styles.body}>
        {/* Left — Send us a Message form card */}
        <motion.form className={styles.formCard} onSubmit={handleSubmit} {...reveal}>
          <div className={styles.formHead}>
            <div>
              <h2 className={styles.formTitle}>Send us a Message</h2>
              <p className={styles.formSubtitle}>
                We'll get back to you within 24 hours.
              </p>
            </div>
            <span className={styles.onlineBadge}>
              <span className={styles.onlineDot} aria-hidden="true" />
              Online
            </span>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name" type="text" name="name" value={formData.name}
                onChange={handleChange} placeholder="Your name"
                className={errors.name ? styles.inputError : ""}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <span id="name-error" className={styles.error}>{errors.name}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email" type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="your@email.com"
                className={errors.email ? styles.inputError : ""}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <span id="email-error" className={styles.error}>{errors.email}</span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone" type="tel" name="phone" value={formData.phone}
                onChange={handleChange} placeholder="+91 98765 43210"
                className={errors.phone ? styles.inputError : ""}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {errors.phone && (
                <span id="phone-error" className={styles.error}>{errors.phone}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="subject">Subject</label>
              <input
                id="subject" type="text" name="subject" value={formData.subject}
                onChange={handleChange} placeholder="How can we help?"
                className={errors.subject ? styles.inputError : ""}
                aria-invalid={!!errors.subject}
                aria-describedby={errors.subject ? "subject-error" : undefined}
              />
              {errors.subject && (
                <span id="subject-error" className={styles.error}>{errors.subject}</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">Your Message</label>
            <textarea
              id="message" name="message" value={formData.message}
              onChange={handleChange} rows={5}
              placeholder="Tell us about your requirements..."
              className={errors.message ? styles.inputError : ""}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {errors.message && (
              <span id="message-error" className={styles.error}>{errors.message}</span>
            )}
          </div>

          {errors.submit && (
            <div className={styles.submitError} role="alert">{errors.submit}</div>
          )}

          <button type="submit" className={styles.sendBtn} disabled={isSubmitting}>
            {isSubmitting ? (
              "Sending…"
            ) : (
              <>
                <Icon icon="mdi:send" aria-hidden="true" />
                Send Message
              </>
            )}
          </button>
          <p className={styles.formNote}>
            Your information is secure and will never be shared.
          </p>
        </motion.form>

        {/* Right — rail */}
        <div className={styles.rail}>
          {/* Visit Our Showroom */}
          <motion.section className={styles.showroom} {...reveal}>
            <div className={styles.showroomHead}>
              <span className={styles.showroomEmblem} aria-hidden="true">
                <Icon icon="mdi:map-marker" />
              </span>
            </div>
            <div className={styles.showroomBody}>
              <h2 className={styles.railTitle}>Visit Our Showroom</h2>
              <p className={styles.showroomAddress}>{SUPPORT_ADDRESS}</p>
              <p className={styles.showroomHours}>
                <Icon icon="mdi:clock-outline" aria-hidden="true" />
                {SUPPORT_HOURS}
              </p>
              <a
                className={styles.directionsBtn}
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon icon="mdi:directions" aria-hidden="true" />
                Get Directions
              </a>
            </div>
          </motion.section>

          {/* Follow Our Journey */}
          {SOCIALS.length > 0 && (
            <motion.section className={styles.railCard} {...reveal}>
              <h2 className={styles.railTitle}>Follow Our Journey</h2>
              <ul className={styles.socialRow}>
                {SOCIALS.map((s) => (
                  <li key={s.key}>
                    <a
                      className={styles.socialLink}
                      href={SOCIAL_LINKS[s.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                    >
                      <Icon icon={s.icon} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {/* Why Choose Us */}
          <motion.section className={styles.railCard} {...reveal}>
            <h2 className={styles.railTitle}>Why Choose Us</h2>
            <ul className={styles.whyList}>
              {WHY_CHOOSE_US.map((item) => (
                <li key={item.id} className={styles.whyItem}>
                  <span className={styles.whyIcon} aria-hidden="true">
                    <Icon icon={item.icon} />
                  </span>
                  <span className={styles.whyTitle}>{item.title}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Support;
