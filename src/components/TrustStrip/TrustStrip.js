import React from "react";
import { Icon } from "@iconify/react";
import styles from "./TrustStrip.module.css";

/**
 * TrustStrip — horizontal band of exactly four static brand reassurances.
 *
 * Non-interactive text + a thin Iconify glyph per item, set in small tracked
 * uppercase. Four-across on desktop, collapsing to a clean 2×2 grid on mobile
 * (no clipping at 360px). The strip paints no ground of its own — the host
 * supplies the bounding hairlines — so it reads correctly under the header nav
 * and inside the SidebarMenu hero alike. Fully token-driven; no fabricated
 * metrics — these are store-attested policies.
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
    // The name belongs on the <ul>, not on the wrapper: aria-label on a plain
    // <div> with no role is ignored by most assistive tech, so the strip was
    // announcing as an unnamed list of four stray phrases.
    <div className={`${styles.strip} ${className}`.trim()}>
      <ul className={styles.list} aria-label="Store guarantees">
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
