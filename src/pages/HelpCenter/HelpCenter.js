import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import {
  FAQ_ITEMS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_HOURS,
} from "../../utils/constants";
import styles from "./HelpCenter.module.css";

const HelpCenter = () => {
  const { isDarkMode } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Each topic carries an Iconify glyph and a category accent token so the icon
  // tiles stay on-brand without any hardcoded colour. Links resolve to real routes.
  const helpTopics = [
    { icon: "mdi:truck-fast-outline", accent: "var(--sf-cat-blue)", title: "Orders & Shipping", desc: "Track orders, delivery times, shipping info", link: "/orders" },
    { icon: "mdi:cash-refund", accent: "var(--sf-cat-teal)", title: "Returns & Refunds", desc: "Return policy, refund process, exchanges", link: "/refund" },
    { icon: "mdi:credit-card-outline", accent: "var(--sf-cat-purple)", title: "Payments", desc: "Payment methods, billing, invoices", link: "/support" },
    { icon: "mdi:account-cog-outline", accent: "var(--sf-cat-orange)", title: "Account & Settings", desc: "Profile, password, login issues", link: "/profile" },
    { icon: "mdi:tag-heart-outline", accent: "var(--sf-cat-pink)", title: "Deals & Offers", desc: "Coupons, special offers, rewards", link: "/special-offers" },
    { icon: "mdi:shield-lock-outline", accent: "var(--sf-cat-red)", title: "Privacy & Security", desc: "Data protection, account security", link: "/privacy" },
  ];

  const filteredFaqs = searchQuery
    ? FAQ_ITEMS.filter((f) => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    : FAQ_ITEMS;

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}><Link to="/">Home</Link> <span>/</span> <span>Help Center</span></div>

      <motion.div className={styles.header} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className={styles.title}>Help Center</h1>
        <p className={styles.lede}>Find answers to common questions or reach out to our silk experts.</p>
        <div className={styles.searchBox}>
          <Icon icon="mdi:magnify" className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search for help..."
            aria-label="Search help articles"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.section className={styles.topics} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <h2 className={styles.sectionTitle}>Browse Help Topics</h2>
        <div className={styles.topicGrid}>
          {helpTopics.map((topic, i) => (
            <Link to={topic.link} key={i} className={styles.topicCard} style={{ "--topic-accent": topic.accent }}>
              <span className={styles.topicIcon}>
                <Icon icon={topic.icon} aria-hidden="true" />
              </span>
              <h3>{topic.title}</h3>
              <p>{topic.desc}</p>
            </Link>
          ))}
        </div>
      </motion.section>

      <motion.section className={styles.faqSection} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {filteredFaqs.length === 0 ? (
            <p className={styles.noResults}>No FAQs match your search. <Link to="/support">Contact us</Link> for help.</p>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div key={faq.id} className={`${styles.faqItem} ${isOpen ? styles.open : ""}`}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`help-faq-answer-${faq.id}`}
                    id={`help-faq-question-${faq.id}`}
                  >
                    <span>{faq.question}</span>
                    <span className={styles.faqToggle} aria-hidden="true" />
                  </button>
                  <div
                    className={styles.faqAnswer}
                    id={`help-faq-answer-${faq.id}`}
                    role="region"
                    aria-labelledby={`help-faq-question-${faq.id}`}
                    aria-hidden={!isOpen}
                  >
                    <div className={styles.faqAnswerInner}><p>{faq.answer}</p></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.section>

      <div className={styles.contactBanner}>
        <h3>Still need help?</h3>
        <p>Our support team is available {SUPPORT_HOURS}</p>
        <div className={styles.contactMeta}>
          <a href={`mailto:${SUPPORT_EMAIL}`}><Icon icon="mdi:email-outline" aria-hidden="true" /> {SUPPORT_EMAIL}</a>
          <span aria-hidden="true">•</span>
          <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}><Icon icon="mdi:phone-outline" aria-hidden="true" /> {SUPPORT_PHONE}</a>
        </div>
        <div className={styles.contactActions}>
          <Link to="/support" className={styles.primaryBtn}>Contact Support</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.secondaryBtn}>Email Us</a>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
