import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import apiService from "../services/api";
import {
  DEFAULT_STORE_SETTINGS,
  normalizeStoreSettings,
  formatMoney,
  fillStoreCopy,
} from "../utils/storeSettings";
import { setActiveCurrency } from "../utils/helpers";
import { applyStoreTitle, storeDocumentTitle } from "../utils/documentTitle";

// =============================================================================
// StoreSettingsContext
// =============================================================================
// One shared read of the `settings` record the admin writes from
// Settings > General. It sits above BOTH route trees in App.js, because the
// same nine values dress both sides of the product:
//
//   name / tagline   the header lockup, the sidebar, the footer, the document
//                    title, the admin shell and the admin sign-in card
//   email/phone/addr  the footer contact block, Contact, the Help Centre and
//                    the colophon on every policy page
//   currency+symbol   every price on the storefront and in the admin
//   taxRate/included  the checkout tax line and the PDP's tax note
//   payment (COD)     whether Cash on Delivery is offered at checkout, and the
//                    fee and order window it is offered within
//
// Refetches when the tab regains focus, and again whenever an admin save fires
// `store-settings:updated`, so a change made in one tab reaches the storefront
// open in the next without a hard reload.
// =============================================================================

export const STORE_SETTINGS_UPDATED_EVENT = "store-settings:updated";

// Fired by the admin Settings screen after a successful save.
export const notifyStoreSettingsUpdated = () => {
  window.dispatchEvent(new CustomEvent(STORE_SETTINGS_UPDATED_EVENT));
};

const defaultValue = {
  ...DEFAULT_STORE_SETTINGS,
  loading: true,
  refresh: () => {},
};

const StoreSettingsContext = createContext(defaultValue);

export const useStoreSettings = () => useContext(StoreSettingsContext);

export const StoreSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const raw = await apiService.settings.get();
      if (mountedRef.current) setSettings(normalizeStoreSettings(raw));
    } catch (error) {
      console.error("Failed to load store settings:", error);
      // Keep the last-known (or default) settings rather than blanking the
      // store's name and every price on the page.
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener(STORE_SETTINGS_UPDATED_EVENT, load);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(STORE_SETTINGS_UPDATED_EVENT, load);
    };
  }, [load]);

  const { store, payment } = settings;

  // Mirror the currency into the helpers module so the plain
  // formatCurrency(amount) calls scattered through the app follow the store
  // without every one of them having to become a hook consumer. Done during
  // render, not in an effect, so the children rendering in THIS pass already
  // read the new symbol.
  setActiveCurrency(store.currency, store.currencySymbol);

  // The browser tab is part of the storefront too. applyStoreTitle stands down
  // while a page holds the tab (the PDP, for its SEO meta title) — settings
  // resolve on their own schedule, so a plain assignment here would overwrite
  // whatever the page had already set.
  useEffect(() => {
    applyStoreTitle(storeDocumentTitle(store));
  }, [store.name, store.tagline]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => {
    const formatPrice = (amount, options = {}) =>
      formatMoney(amount, {
        currency: store.currency,
        currencySymbol: store.currencySymbol,
        decimals: options.decimals ?? 2,
      });

    return {
      store,
      payment,
      loading,
      refresh: load,

      // Flattened for the call sites that only want one field.
      storeName: store.name,
      tagline: store.tagline,
      email: store.email,
      phone: store.phone,
      address: store.address,
      currency: store.currency,
      currencySymbol: store.currencySymbol,
      taxRate: store.taxRate,
      taxIncluded: store.taxIncluded,

      // `tel:` wants digits and a leading +, nothing else.
      phoneHref: `tel:${(store.phone || "").replace(/[^\d+]/g, "")}`,
      emailHref: `mailto:${store.email}`,

      formatPrice,

      // Fills {freeShipping} / {codSentence} / {taxNote} in the shared copy
      // (FAQ answers, the promise strip) from these same settings.
      fillCopy: (text) => fillStoreCopy(text, { store, payment }),
    };
  }, [store, payment, loading, load]);

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export default StoreSettingsContext;
