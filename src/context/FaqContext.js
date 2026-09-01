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
import { DEFAULT_FAQS, normalizeFaqs, faqsForPlacement, faqsForProduct } from "../utils/faqs";

// =============================================================================
// FaqContext
// =============================================================================
// One shared read of the `faqs` collection the admin manages from
// Admin > Storefront > FAQs. Three surfaces sit under it and each asks for the
// slice it needs, so the collection is fetched once per storefront visit:
//
//   forProduct(product)  the PDP's FAQs tab — the product's own answers first,
//                        then the general ones
//   forPlacement("help") the Help Centre's searchable list
//   forPlacement("home") the shared Frequently Asked Questions block
//
// Refetches when the tab regains focus, and again whenever an admin save fires
// `faqs:updated`, so an answer edited in one tab reaches the storefront open in
// the next without a hard reload — the same contract StoreSettingsContext has.
//
// An unreachable API leaves the built-in FAQ_ITEMS in place rather than
// emptying the accordion.
// =============================================================================

export const FAQS_UPDATED_EVENT = "faqs:updated";

// Fired by the admin FAQs screen after a successful save.
export const notifyFaqsUpdated = () => {
  window.dispatchEvent(new CustomEvent(FAQS_UPDATED_EVENT));
};

const FALLBACK = normalizeFaqs(DEFAULT_FAQS);

const defaultValue = {
  faqs: FALLBACK,
  loading: true,
  refresh: () => {},
  forPlacement: (placement) => faqsForPlacement(FALLBACK, placement),
  forProduct: (product) => faqsForProduct(FALLBACK, product),
};

const FaqContext = createContext(defaultValue);

export const useFaqs = () => useContext(FaqContext);

export const FaqProvider = ({ children }) => {
  const [faqs, setFaqs] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const rows = await apiService.faqs.getAll();
      if (!mountedRef.current) return;
      const normalized = normalizeFaqs(rows);
      // An empty collection is treated as "not configured", not as "no answers":
      // the built-in set stands until the admin has written one of their own.
      setFaqs(normalized.length ? normalized : FALLBACK);
    } catch (error) {
      console.error("Failed to load FAQs:", error);
      // Keep the last-known (or built-in) answers on the page.
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener(FAQS_UPDATED_EVENT, load);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(FAQS_UPDATED_EVENT, load);
    };
  }, [load]);

  const value = useMemo(
    () => ({
      faqs,
      loading,
      refresh: load,
      forPlacement: (placement) => faqsForPlacement(faqs, placement),
      forProduct: (product) => faqsForProduct(faqs, product),
    }),
    [faqs, loading, load]
  );

  return <FaqContext.Provider value={value}>{children}</FaqContext.Provider>;
};

export default FaqContext;
