import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { overlay, panel } from "../../theme/motion";
import styles from "./BottomDrawer.module.css";

// A generic bottom sheet. Motion is the shared drawer treatment from
// theme/motion.js — it used to arrive on a spring (damping 25 / stiffness 300),
// which read bouncier than anything else on the storefront.
const BottomDrawer = ({ open, onClose, title, children }) => {
  const reduceMotion = useReducedMotion();
  const scrim = overlay(reduceMotion);
  const sheet = panel(reduceMotion, "bottom");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className={styles.backdrop} {...scrim} onClick={onClose} />
          <motion.div className={styles.drawer} {...sheet}>
            <div className={styles.handle} />
            {title && <div className={styles.drawerHeader}><h3>{title}</h3><button onClick={onClose} className={styles.closeBtn} aria-label="Close">&times;</button></div>}
            <div className={styles.drawerContent}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomDrawer;
