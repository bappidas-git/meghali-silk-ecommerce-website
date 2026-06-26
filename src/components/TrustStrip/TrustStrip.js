import React from "react";
import { Icon } from "@iconify/react";
import styles from "./TrustStrip.module.css";

/**
 * TrustStrip — horizontal band of exactly four static brand reassurances.
 *
 * Non-interactive text + Iconify icon per item. Four-across on desktop,
 * collapses to a clean 2×2 grid on mobile (no clipping at 360px). Fully
 * token-driven; no fabricated metrics — these are static guarantees.
 */
const TRUST_ITEMS = [
  { id: "returns", label: "7-Day Easy Returns", icon: "mdi:autorenew" },
  { id: "moneyback", label: "100% Money Back", icon: "mdi:shield-check" },
  { id: "shipping", label: "Free Shipping", icon: "mdi:truck-fast-outline" },
  { id: "authentic", label: "Authentic Silk", icon: "mdi:certificate-outline" },
];

const TrustStrip = ({ items = TRUST_ITEMS, className = "" }) => {
  const list = items && items.length ? items : TRUST_ITEMS;

  return (
    <div className={`${styles.strip} ${className}`.trim()} aria-label="Store guarantees">
      <ul className={styles.list}>
        {list.map((item) => (
          <li key={item.id} className={styles.item}>
            <Icon icon={item.icon} className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrustStrip;
