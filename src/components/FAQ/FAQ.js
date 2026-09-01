import React, { useState } from "react";
import { useFaqs } from "../../context/FaqContext";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import styles from "./FAQ.module.css";

// The shared "Frequently Asked Questions" block. The answers are the admin's
// (Admin > Storefront > FAQs) — only the ones switched on for this block, in
// the order set there. Renders nothing when there are none to show.
const FAQ = () => {
  const [openId, setOpenId] = useState(null);
  // The shipping, COD and tax figures in the answers are the store's own.
  const { fillCopy } = useStoreSettings();
  const { forPlacement } = useFaqs();
  const items = forPlacement("home");

  if (items.length === 0) return null;

  return (
    <section className={styles.faq}>
      <div className={styles.container}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.list}>
          {items.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className={`${styles.item} ${isOpen ? styles.open : ""}`}>
                <button
                  className={styles.question}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  id={`faq-question-${faq.id}`}
                >
                  <span>{faq.question}</span>
                  <span className={styles.toggle} aria-hidden="true" />
                </button>
                <div
                  className={styles.answer}
                  id={`faq-answer-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-question-${faq.id}`}
                  aria-hidden={!isOpen}
                >
                  <div className={styles.answerInner}><p>{fillCopy(faq.answer)}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
