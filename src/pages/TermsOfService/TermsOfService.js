import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { APP_NAME, SUPPORT_EMAIL, POLICY_LAST_UPDATED } from "../../utils/constants";
import styles from "./TermsOfService.module.css";

const TermsOfService = () => {
  const { isDarkMode } = useTheme();

  const sections = [
    { title: "Acceptance of Terms", content: `By accessing or using ${APP_NAME}, operated by Galleria Producer Company Limited (Kolkata, West Bengal), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.` },
    { title: "Account Registration", content: "You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to use our services." },
    { title: "Orders & Pricing", content: "All prices are listed in Indian Rupees (₹/INR) and are inclusive of applicable GST unless stated otherwise. We reserve the right to modify prices without prior notice. Orders are subject to acceptance and availability of the handloom silk in stock." },
    { title: "Payment Terms", content: "We accept various payment methods including credit/debit cards, UPI, net banking, wallets, and Cash on Delivery. All payments are processed through secure, PCI-compliant payment gateways." },
    { title: "Shipping & Delivery", content: "We offer free standard shipping on all orders above ₹999; a nominal delivery fee applies below that. Standard delivery takes 5-7 business days, with express options available in select cities. Delivery timelines are estimates and may vary based on location and availability; we are not responsible for delays caused by carriers, natural disasters, or circumstances beyond our control." },
    { title: "Returns & Refunds", content: "Eligible products may be returned within 7 days of delivery subject to our Return & Refund Policy. Refunds are processed to the original payment method within 5-7 business days after the returned item is received and inspected." },
    { title: "Intellectual Property", content: `All content on ${APP_NAME}, including text, images, weave designs, logos, and software, is the property of Galleria Producer Company Limited or licensed to us. You may not reproduce, distribute, or create derivative works without written permission.` },
    { title: "Limitation of Liability", content: `${APP_NAME} is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages arising from your use of our platform.` },
    { title: "Governing Law", content: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kolkata, West Bengal." },
  ];

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.breadcrumb}><Link to="/">Home</Link> <span>/</span> <span>Terms of Service</span></div>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.subtitle}>Last updated: {POLICY_LAST_UPDATED}</p>
        <p className={styles.intro}>Please read these terms carefully before using {APP_NAME}.</p>
      </motion.div>
      <div className={styles.sections}>
        {sections.map((section, i) => (
          <motion.div key={i} className={styles.section} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}>
            <h2><span>{i + 1}.</span> {section.title}</h2>
            <p>{section.content}</p>
          </motion.div>
        ))}
      </div>
      <div className={styles.contact}><p>Questions? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p></div>
    </div>
  );
};

export default TermsOfService;
