import React, { useState } from "react";
import { FAQ_ITEMS } from "../../utils/constants";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import styles from "./FAQ.module.css";

const FAQ = () => {
  const [openId, setOpenId] = useState(null);
  // The shipping, COD and tax figures in the answers are the store's own.
  const { fillCopy } = useStoreSettings();

  return (
    <section className={styles.faq}>
      <div className={styles.container}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.list}>
          {FAQ_ITEMS.map((faq) => {
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
