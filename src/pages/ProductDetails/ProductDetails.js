import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../context/WishlistContext";
import apiService from "../../services/api";
import { categoryParam } from "../../utils/categories";
import { STOREFRONT_CONFIG } from "../../theme/tokens";
import { FAQ_ITEMS } from "../../utils/constants";
import {
  ProductGallery,
  SocialProof,
  PriceBlock,
  VariantSelector,
  QuantityStepper,
  TrustBadges,
  DeliveryReturnsInfo,
  AddToCartBar,
  ReviewsSection,
  RelatedProducts,
  FrequentlyBoughtTogether,
} from "../../components/storefront";
import styles from "./ProductDetails.module.css";

// =============================================================================
// Product Detail Page (PDP)
// =============================================================================
// Assembled entirely from the reusable, themeable, domain-agnostic storefront
// component library (src/components/storefront). This page owns DATA (loading,
// variant/stock derivation, the reviews blend, cart wiring); the components own
// PRESENTATION + the UX principles. Everything here is API/db.json-driven — no
// hardcoded business content — and every persuasive element is bound to real
// data (see the ethics notes in STOREFRONT_UX_GUIDELINES.md).
// =============================================================================

// ─── Loading Skeleton ───────────────────────────────────────────────────────
const Skeleton = () => (
  <div className={styles.skeletonPage}>
    <div className={styles.skeletonBreadcrumb} />
    <div className={styles.skeletonLayout}>
      <div className={styles.skeletonMainImage} />
      <div className={styles.skeletonRight}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonRating} />
        <div className={styles.skeletonPrice} />
        <div className={styles.skeletonDesc} />
        <div className={styles.skeletonDesc} />
        <div className={styles.skeletonButtons} />
      </div>
    </div>
  </div>
);

// ─── Not Found State ────────────────────────────────────────────────────────
const NotFound = () => (
  <div className={styles.notFound}>
    <div className={styles.notFoundIcon}>404</div>
    <h2>Product Not Found</h2>
    <p>The product you are looking for does not exist or has been removed.</p>
    <Link to="/products" className={styles.notFoundLink}>
      Browse Products
    </Link>
  </div>
);

// ─── Authenticity helpers (PREMIUM ribbon + KEY FEATURES) ─────────────────────
// The gold "PREMIUM" ribbon shows ONLY when the product is genuinely flagged —
// same rule the storefront ProductCard uses (featured / bridal / premium tag).
const isPremiumProduct = (product) => {
  const tags = Array.isArray(product?.tags) ? product.tags : [];
  return (
    product?.featured === true ||
    tags.includes("bridal") ||
    tags.includes("premium")
  );
};

// KEY FEATURES bind to REAL product fields only. Prefer an explicit
// features/highlights array; otherwise derive concise bullets from genuine spec
// fields (fabric attribute, brand, weight, dimensions). Returns [] when there is
// nothing real to show — the block is then omitted entirely. The product's
// shortDescription is never repurposed here, so it stays visible on its own.
const deriveKeyFeatures = (product) => {
  if (!product) return [];

  const explicit = Array.isArray(product.features)
    ? product.features
    : Array.isArray(product.highlights)
    ? product.highlights
    : null;
  if (explicit && explicit.length > 0) {
    return explicit.map((f) => String(f)).filter(Boolean);
  }

  const bullets = [];

  // Fabric composition — read from the real variant attributes.
  const fabrics = [
    ...new Set(
      (product.variants || [])
        .map((v) => v?.attributes?.Fabric)
        .filter((f) => f != null && f !== "")
    ),
  ];
  if (fabrics.length > 0) {
    bullets.push(
      fabrics.length === 1
        ? `Woven in pure ${fabrics[0]}`
        : `Available in ${fabrics.join(", ")}`
    );
  }

  if (product.brand) bullets.push(`Crafted by ${product.brand}`);

  if (product.weight != null && product.weight !== "") {
    bullets.push(`Net weight ${product.weight} kg`);
  }

  const d = product.dimensions;
  if (d) {
    const dims =
      typeof d === "object"
        ? [d.length, d.width, d.height]
            .filter((v) => v != null && v !== "")
            .join(" × ")
        : String(d);
    if (dims) bullets.push(`Measures ${dims} cm`);
  }

  return bullets;
};

// ─── Specifications / Fabric & Craft / FAQ assembly (REAL data only) ──────────
// The PDP owns all data assembly; the panels below are pure render. Every helper
// here returns ONLY real values and OMITS anything missing — nothing is invented.

// The silk spec rows, in the order the design shows them.
const SILK_SPEC_LABELS = [
  "Warp Yarn",
  "Weft Yarn",
  "Design",
  "Saree Length",
  "Blouse Length",
  "Border Width",
  "Blouse Width",
  "Weave Type",
  "Origin",
  "Occasion",
  "Craft Time",
];

const normalizeSpecKey = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, "");

// Merge the structured spec sources (specifications → specs → attributes) into a
// single normalized-key map. Earlier sources win; empty values are dropped.
const collectSpecSources = (product) => {
  const merged = {};
  [product?.specifications, product?.specs, product?.attributes].forEach((src) => {
    if (src && typeof src === "object" && !Array.isArray(src)) {
      Object.entries(src).forEach(([k, v]) => {
        const nk = normalizeSpecKey(k);
        if (merged[nk] === undefined && v != null && String(v).trim() !== "") {
          merged[nk] = v;
        }
      });
    }
  });
  return merged;
};

const cleanSpecValue = (v) => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.filter((x) => x != null && x !== "").join(", ");
  return String(v).trim();
};

// Distinct fabrics across the real variants — a genuine yarn hint when the
// product carries no explicit warp/weft spec.
const variantFabrics = (product) => [
  ...new Set(
    (product?.variants || [])
      .map((v) => v?.attributes?.Fabric)
      .filter((f) => f != null && f !== "")
  ),
];

// Build the silk spec table rows. Returns [] unless the product carries at least
// one EXPLICIT silk spec field (specifications/specs/attributes) — the variant
// fabric / occasion fallbacks only enrich an already-silk product, they never
// fabricate a silk table on their own.
const deriveSilkSpecRows = (product) => {
  const map = collectSpecSources(product);
  const hasExplicit = SILK_SPEC_LABELS.some((l) =>
    cleanSpecValue(map[normalizeSpecKey(l)])
  );
  if (!hasExplicit) return [];

  const fabrics = variantFabrics(product);
  const singleFabric = fabrics.length === 1 ? fabrics[0] : null;
  const fallbacks = {
    "Warp Yarn": singleFabric,
    "Weave Type": product?.weaveType,
    Origin: product?.origin || product?.originRegion,
    "Craft Time": product?.craftTime,
    Occasion: product?.occasion || product?.occasions,
  };

  const rows = [];
  SILK_SPEC_LABELS.forEach((label) => {
    let value = map[normalizeSpecKey(label)];
    if (value == null || value === "") value = fallbacks[label];
    const text = cleanSpecValue(value);
    if (text) rows.push({ label, value: text });
  });
  return rows;
};

// Generic spec fallback (Brand/SKU/Weight/Dimensions/Category/Tags) — used only
// when no silk-specific data is present. Still real-data-only.
const deriveGenericSpecRows = (product, category, sku) => {
  const rows = [];
  if (product?.brand) rows.push({ label: "Brand", value: product.brand });
  if (sku) rows.push({ label: "SKU", value: sku });
  if (product?.weight != null && product.weight !== "") {
    rows.push({ label: "Weight", value: `${product.weight} kg` });
  }
  const d = product?.dimensions;
  if (d) {
    const dims =
      typeof d === "object"
        ? [d.length, d.width, d.height]
            .filter((v) => v != null && v !== "")
            .join(" × ")
        : String(d);
    if (dims) rows.push({ label: "Dimensions", value: `${dims} cm` });
  }
  if (category?.name) rows.push({ label: "Category", value: category.name });
  if (Array.isArray(product?.tags) && product.tags.length > 0) {
    rows.push({ label: "Tags", value: product.tags.join(", ") });
  }
  return rows;
};

// Fabric & Craft narrative. Returns null (→ tab hidden) unless there is genuine
// craft-specific content: an explicit story field, OR a real weave/origin/craft
// fact. Fabric alone (already shown elsewhere) never triggers the tab.
const deriveFabricCraft = (product) => {
  const map = collectSpecSources(product);
  const get = (label) => cleanSpecValue(map[normalizeSpecKey(label)]);
  const story = cleanSpecValue(product?.fabricAndCraft || product?.craftStory);

  const facts = [];
  const fabrics = variantFabrics(product);
  const fabricVal = fabrics.length ? fabrics.join(", ") : get("Fabric");
  if (fabricVal) facts.push({ label: "Fabric", value: fabricVal });

  const weave = get("Weave Type") || cleanSpecValue(product?.weaveType);
  if (weave) facts.push({ label: "Weave Type", value: weave });
  const origin =
    get("Origin") || cleanSpecValue(product?.origin || product?.originRegion);
  if (origin) facts.push({ label: "Origin", value: origin });
  const craftTime = get("Craft Time") || cleanSpecValue(product?.craftTime);
  if (craftTime) facts.push({ label: "Craft Time", value: craftTime });

  const craftFacts = facts.filter((f) => f.label !== "Fabric");
  if (!story && craftFacts.length === 0) return null;
  return { story, facts };
};

// FAQs — product-specific first, then the shared brand FAQs, de-duped by
// question. Each entry is normalized to { question, answer }.
const buildFaqs = (product) => {
  const productFaqs = Array.isArray(product?.faqs) ? product.faqs : [];
  const normalize = (f) => ({
    question: cleanSpecValue(f?.question || f?.q),
    answer: cleanSpecValue(f?.answer || f?.a),
  });
  const seen = new Set();
  return [...productFaqs, ...FAQ_ITEMS]
    .map(normalize)
    .filter((f) => f.question && f.answer)
    .filter((f) => {
      const key = f.question.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

// ═══════════════════════════════════════════════════════════════════════════
const ProductDetails = () => {
  // Route is /products/:slug (slug canonical; legacy numeric id still resolves).
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const prefersReducedMotion = useReducedMotion();
  const tabsRef = useRef(null);
  const tabRefs = useRef([]); // roving focus across the tablist
  const buyBoxRef = useRef(null); // anchor for the sticky mobile Add-to-Cart bar

  // ── State ──────────────────────────────────────────────────────────────
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [openFaq, setOpenFaq] = useState(null);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [bundle, setBundle] = useState([]);
  const [category, setCategory] = useState(null);
  const [settings, setSettings] = useState(null);
  const [shipping, setShipping] = useState([]);

  // ── Fetch product ──────────────────────────────────────────────────────
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);

      const isLegacyId = /^\d+$/.test(String(slug));
      let data = isLegacyId
        ? await apiService.products.getById(slug)
        : await apiService.products.getBySlug(slug);

      if (!data) {
        data = isLegacyId
          ? await apiService.products.getBySlug(slug).catch(() => null)
          : await apiService.products.getById(slug).catch(() => null);
      }

      if (!data) {
        setNotFound(true);
        return;
      }

      // Canonicalise the URL to the slug form so old links never 404.
      if (data.slug && String(slug) !== String(data.slug)) {
        navigate(`/products/${data.slug}`, { replace: true });
      }

      setProduct(data);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setQuantity(1);

      // Recently viewed (key must match what Home.js reads).
      try {
        const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
        const filtered = viewed.filter((item) => String(item.id) !== String(data.id));
        filtered.unshift({
          id: data.id,
          slug: data.slug,
          name: data.name,
          brand: data.brand,
          image: data.images?.[0] || data.image,
          images: data.images,
          price: data.price,
          comparePrice: data.comparePrice,
          variants: data.variants,
          rating: data.rating,
          totalReviews: data.totalReviews,
          viewedAt: new Date().toISOString(),
        });
        localStorage.setItem("recentlyViewed", JSON.stringify(filtered.slice(0, 20)));
      } catch (e) {
        /* ignore localStorage errors */
      }

      if (data.categoryId) {
        apiService.categories
          .getById(data.categoryId)
          .then(setCategory)
          .catch(() => {});
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  // ── Fetch reviews (approved only — enforced by the API) ─────────────────
  const fetchReviews = useCallback(async () => {
    const productId = product?.id;
    if (!productId) return;
    try {
      setReviewsLoading(true);
      setReviewsError(false);
      const data = await apiService.products.getReviews(productId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
      setReviewsError(true);
    } finally {
      setReviewsLoading(false);
    }
  }, [product?.id]);

  // ── Related + bundle (AOV) — real catalogue data only ───────────────────
  const fetchAov = useCallback(async () => {
    if (!product) return;
    const cfg = STOREFRONT_CONFIG.aov;
    if (cfg.relatedProducts) {
      apiService.products
        .getRelated(product, cfg.maxRelated)
        .then(setRelatedProducts)
        .catch(() => setRelatedProducts([]));
    }
    if (cfg.frequentlyBoughtTogether) {
      apiService.products
        .getFrequentlyBoughtTogether(product, cfg.maxBundle - 1)
        .then(setBundle)
        .catch(() => setBundle([]));
    }
  }, [product]);

  // ── Public store data for trust signals + transparent delivery info ─────
  useEffect(() => {
    apiService.settings.get().then(setSettings).catch(() => {});
    apiService.shipping.getMethods().then((m) => setShipping(Array.isArray(m) ? m : [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [fetchProduct]);

  useEffect(() => {
    if (product) {
      fetchReviews();
      fetchAov();
    }
  }, [product, fetchReviews, fetchAov]);

  // ── Derived values ─────────────────────────────────────────────────────
  const images =
    product?.images?.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const comparePrice = product?.comparePrice || 0;
  const discount =
    comparePrice > currentPrice
      ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
      : 0;
  const currentSku = selectedVariant?.sku || product?.sku || "";

  // Stock for the active selection — variant stock, else product stock (never
  // silently 0). Low-stock uses the product's REAL threshold (not a magic 5).
  const currentStock = selectedVariant
    ? typeof selectedVariant.stock === "number"
      ? selectedVariant.stock
      : product?.stock
    : product?.stock;
  const hasStockInfo = typeof currentStock === "number";
  const isOutOfStock = hasStockInfo && currentStock <= 0;
  const lowStockThreshold = Number(product?.lowStockThreshold) || 5;
  const isLowStock = !isOutOfStock && hasStockInfo && currentStock <= lowStockThreshold;
  const STOCK_UNKNOWN_MAX = 10;
  const maxQuantity = hasStockInfo ? Math.max(1, currentStock) : STOCK_UNKNOWN_MAX;

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), maxQuantity));
  }, [maxQuantity]);

  // ── Reviews blend (consistent average across the page) ──────────────────
  const baseRating = Number(product?.rating) || 0;
  const baseCount = Number(product?.totalReviews) || 0;
  const reviewSum = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
  const totalRatingsCount = baseCount + reviews.length;
  const displayAvg =
    totalRatingsCount > 0
      ? (baseRating * baseCount + reviewSum) / totalRatingsCount
      : baseRating;

  // ── Cart wiring ────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(
    (options) => {
      if (!product) return;
      if (product.variants?.length > 0 && !selectedVariant) return;

      const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
      const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
      const cartItem = {
        id: selectedVariant ? `${product.id}-${selectedVariant.id}` : String(product.id),
        productId: product.id,
        slug: product.slug || null,
        variantId: selectedVariant?.id || null,
        variantName: selectedVariant?.name || null,
        name: product.name,
        image: product.images?.[0] || product.image || "",
        price: effectivePrice,
        comparePrice: product.comparePrice || 0,
        currency: "INR",
        ...(effectiveStock != null && effectiveStock !== ""
          ? { stock: Number(effectiveStock) }
          : {}),
      };
      return addToCart(cartItem, quantity, options);
    },
    [product, selectedVariant, quantity, addToCart]
  );

  // Primary CTA with a brief, satisfying "Added ✓" confirmation (the cart toast
  // + mini-cart drawer also fire from CartContext).
  const handleAddClick = useCallback(() => {
    if (isOutOfStock) return;
    handleAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }, [handleAddToCart, isOutOfStock]);

  const handleBuyNow = useCallback(async () => {
    await handleAddToCart({ openDrawer: false });
    navigate("/checkout");
  }, [handleAddToCart, navigate]);

  const scrollToReviews = useCallback(() => {
    setActiveTab("reviews");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) return <Skeleton />;
  if (notFound || !product) return <NotFound />;

  const wishlisted = isInWishlist(product.id);
  const premium = isPremiumProduct(product);
  const keyFeatures = deriveKeyFeatures(product);
  const categoryLabel = category?.name || product.brand;

  // ── Below-the-fold panel data (assembled here; panels just render it) ─────
  const silkSpecRows = deriveSilkSpecRows(product);
  const specRows =
    silkSpecRows.length > 0
      ? silkSpecRows
      : deriveGenericSpecRows(product, category, currentSku);
  const fabricCraft = deriveFabricCraft(product);
  const faqs = buildFaqs(product);

  // Tabs in the design order; Fabric & Craft / FAQs appear only with real data.
  const tabs = [
    { id: "description", label: "Description" },
    { id: "specifications", label: "Specifications" },
    ...(fabricCraft ? [{ id: "fabric", label: "Fabric & Craft" }] : []),
    { id: "reviews", label: `Reviews (${reviews.length})` },
    ...(faqs.length > 0 ? [{ id: "faqs", label: "FAQs" }] : []),
  ];

  // Roving keyboard navigation across the tablist (Left/Right/Home/End).
  const handleTabKeyDown = (e, idx) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const last = tabs.length - 1;
    let next = idx;
    if (e.key === "ArrowRight") next = idx === last ? 0 : idx + 1;
    else if (e.key === "ArrowLeft") next = idx === 0 ? last : idx - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  // Framer Motion panel transition — disabled under reduced-motion.
  const panelMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25 },
      };

  // The promises band — owner-attested. The free-shipping line resolves
  // its threshold from LIVE shipping data, so any number shown is never invented.
  const freeShipThresholds = (Array.isArray(shipping) ? shipping : [])
    .map((m) => Number(m.freeAbove))
    .filter((n) => Number.isFinite(n) && n > 0);
  const minFreeShip = freeShipThresholds.length
    ? Math.min(...freeShipThresholds)
    : null;
  const trustCards = [
    {
      key: "offers",
      title: "Offers",
      text: "Seasonal offers & savings",
      icon: (
        <>
          <path d="M20 12v10H4V12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
        </>
      ),
    },
    {
      key: "shipping",
      title: "Free shipping",
      text: minFreeShip
        ? `Free above ₹${minFreeShip.toLocaleString("en-IN")}`
        : "Free shipping across India",
      icon: (
        <>
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </>
      ),
    },
    {
      key: "authentic",
      title: "100% authentic",
      text: "Certified genuine silk",
      icon: (
        <>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </>
      ),
    },
    {
      key: "artisans",
      title: "Handwoven by artisans",
      text: "Crafted on the handloom",
      icon: (
        <>
          <path d="M12 3l1.9 4.6L19 8.3l-3.6 3.3.9 4.9L12 14.3 7.7 16.5l.9-4.9L5 8.3l5.1-.7z" />
        </>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}
    >
      <div className={styles.container}>
        {/* ── Breadcrumb (orientation) ──────────────────────────────────── */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/" className={styles.breadcrumbLink}>
            Home
          </Link>
          <span className={styles.breadcrumbSep} aria-hidden="true">
            /
          </span>
          {category ? (
            <>
              <Link
                to={`/products?category=${categoryParam(category)}`}
                className={styles.breadcrumbLink}
              >
                {category.name}
              </Link>
              <span className={styles.breadcrumbSep} aria-hidden="true">
                /
              </span>
            </>
          ) : null}
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {/* ═══ Above the fold — the plate on the left, the buy box on the right.
            The gallery column scrolls; the buy box is a sticky rail from 981px
            up so the price and the CTA stay with the shopper. ═══════════════ */}
        <div className={styles.mainLayout}>
          <div className={styles.gallerySection}>
            {/* PREMIUM ribbon + In-Stock mark bind to REAL flags only (default off) */}
            <ProductGallery
              images={images}
              alt={product.name}
              discount={discount}
              ribbon={premium ? "PREMIUM" : null}
              inStock={!isOutOfStock && hasStockInfo}
            />
          </div>

          <div className={styles.infoSection}>
            {/* ── The head: eyebrow, the name in the serif, one line of fact ── */}
            <header className={styles.buyHead}>
              {categoryLabel && (
                <span className={styles.categoryLabel}>{categoryLabel}</span>
              )}
              <h1 className={styles.productName}>{product.name}</h1>

              {/* Social proof — real ratings only, jumps to the reviews */}
              <SocialProof
                rating={displayAvg}
                count={totalRatingsCount}
                onReviewsClick={scrollToReviews}
              />
            </header>

            {/* ── The price moment — honest compare/discount + tax note ────── */}
            <div className={styles.pricePanel}>
              <PriceBlock
                price={currentPrice}
                comparePrice={comparePrice}
                currency="INR"
                size="lg"
                taxNote={
                  settings?.store?.taxIncluded === false
                    ? "Exclusive of taxes — calculated at checkout"
                    : "Inclusive of all taxes"
                }
              />
              {currentSku && (
                <div className={styles.skuLine}>
                  <span className={styles.skuLabel}>SKU</span>
                  <span className={styles.skuValue}>{currentSku}</span>
                </div>
              )}
            </div>

            {product.shortDescription && (
              <p className={styles.shortDescription}>{product.shortDescription}</p>
            )}

            {/* KEY FEATURES — real spec-derived bullets only (omitted if none),
                set as a ruled list rather than a boxed panel. */}
            {keyFeatures.length > 0 && (
              <div className={styles.featuresPanel}>
                <span className={styles.featuresTitle}>Key Features</span>
                <ul className={styles.featuresList}>
                  {keyFeatures.map((feature, i) => (
                    <li key={i} className={styles.featureItem}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variant selection — visible swatches/tiles, never a dropdown */}
            {product.variants && product.variants.length > 0 && (
              <div className={styles.variantBlock}>
                <VariantSelector
                  variants={product.variants}
                  value={selectedVariant}
                  onChange={setSelectedVariant}
                  productStock={product.stock}
                  currency="INR"
                />
              </div>
            )}

            {/* Quantity + honest stock status */}
            <div className={styles.purchaseRow}>
              <div className={styles.quantityBlock}>
                <span className={styles.quantityLabel}>Quantity</span>
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={maxQuantity}
                  disabled={isOutOfStock}
                />
              </div>
              <div className={styles.stockStatus}>
                {isOutOfStock ? (
                  <span className={styles.stockOut}>Out of Stock</span>
                ) : isLowStock ? (
                  <span className={styles.stockLow}>Only {currentStock} left</span>
                ) : hasStockInfo ? (
                  <span className={styles.stockIn}>In Stock</span>
                ) : null}
              </div>
            </div>

            {/* Primary / secondary CTAs. This row is ALSO the anchor the sticky
                mobile bar observes — keep the ref here. */}
            <div className={styles.actionButtons} ref={buyBoxRef}>
              <button
                type="button"
                className={`sf-btn sf-btn--emerald sf-btn--lg ${styles.buyNowBtn}`}
                onClick={handleBuyNow}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Out of Stock" : "Buy Now"}
              </button>
              <button
                type="button"
                className={`sf-btn sf-btn--lg ${styles.addToCartBtn} ${
                  added ? styles.addToCartDone : ""
                }`}
                onClick={handleAddClick}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
              </button>
              <button
                type="button"
                className={`${styles.wishlistBtn} ${
                  wishlisted ? styles.wishlistBtnActive : ""
                }`}
                onClick={() => toggleWishlist(product)}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wishlisted}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>

            {/* ── The assurance block: the promises and the delivery note read
                as ONE ruled block, every number resolved from live data. ──── */}
            <div className={styles.assurance}>
              <TrustBadges settings={settings} shipping={shipping} variant="grid" />
              <DeliveryReturnsInfo shipping={shipping} settings={settings} currency="INR" />
            </div>
          </div>
        </div>

        {/* ── The promises band — owner-attested, ruled across the page. The
            free-shipping line resolves its threshold from LIVE shipping data,
            so any number shown here is never invented. ──────────────────── */}
        <ul className={styles.trustRow} aria-label="Our promises">
          {trustCards.map((card) => (
            <li className={styles.trustCard} key={card.key}>
              <span className={styles.trustIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  {card.icon}
                </svg>
              </span>
              <span className={styles.trustText}>
                <span className={styles.trustTitle}>{card.title}</span>
                <span className={styles.trustDetail}>{card.text}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* ── Below the fold: brand tabbed section (5 tabs, accessible) ──── */}
        <div className={styles.tabsSection} ref={tabsRef}>
          <div className={styles.tabNav} role="tablist" aria-label="Product information">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[idx] = el)}
                  type="button"
                  role="tab"
                  id={`pdp-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`pdp-panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className={styles.tabContent}>
            {/* Description */}
            {activeTab === "description" && (
              <motion.div
                {...panelMotion}
                role="tabpanel"
                id="pdp-panel-description"
                aria-labelledby="pdp-tab-description"
                className={styles.descriptionPanel}
              >
                <h3 className={styles.panelTitle}>Product Description</h3>
                <p className={styles.prose}>
                  {product.description || "No description available."}
                </p>
              </motion.div>
            )}

            {/* Specifications — silk spec table (real data, missing rows omitted) */}
            {activeTab === "specifications" && (
              <motion.div
                {...panelMotion}
                role="tabpanel"
                id="pdp-panel-specifications"
                aria-labelledby="pdp-tab-specifications"
                className={styles.specPanel}
              >
                <h3 className={styles.panelTitle}>Product Specification</h3>
                {specRows.length > 0 ? (
                  <dl className={styles.specGrid}>
                    {specRows.map((row) => (
                      <div className={styles.specPair} key={row.label}>
                        <dt className={styles.specLabel}>{row.label}</dt>
                        <dd className={styles.specValue}>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className={styles.specNote}>Full specifications coming soon.</p>
                )}
              </motion.div>
            )}

            {/* Fabric & Craft — only rendered when the tab exists (real data) */}
            {activeTab === "fabric" && fabricCraft && (
              <motion.div
                {...panelMotion}
                role="tabpanel"
                id="pdp-panel-fabric"
                aria-labelledby="pdp-tab-fabric"
                className={styles.fabricPanel}
              >
                <h3 className={styles.panelTitle}>Fabric &amp; Craft</h3>
                {fabricCraft.story && (
                  <p className={styles.prose}>{fabricCraft.story}</p>
                )}
                {fabricCraft.facts.length > 0 && (
                  <dl className={styles.craftFacts}>
                    {fabricCraft.facts.map((f) => (
                      <div className={styles.craftFact} key={f.label}>
                        <dt className={styles.specLabel}>{f.label}</dt>
                        <dd className={styles.specValue}>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </motion.div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <motion.div
                {...panelMotion}
                role="tabpanel"
                id="pdp-panel-reviews"
                aria-labelledby="pdp-tab-reviews"
              >
                <ReviewsSection
                  reviews={reviews}
                  displayAvg={displayAvg}
                  totalRatingsCount={totalRatingsCount}
                  loading={reviewsLoading}
                  error={reviewsError}
                  onRetry={fetchReviews}
                />
              </motion.div>
            )}

            {/* FAQs — accessible accordion */}
            {activeTab === "faqs" && faqs.length > 0 && (
              <motion.div
                {...panelMotion}
                role="tabpanel"
                id="pdp-panel-faqs"
                aria-labelledby="pdp-tab-faqs"
                className={styles.faqPanel}
              >
                <h3 className={styles.panelTitle}>Frequently Asked Questions</h3>
                <div className={styles.faqList}>
                  {faqs.map((faq, i) => {
                    const isOpen = openFaq === i;
                    return (
                      <div className={styles.faqItem} key={i}>
                        <button
                          type="button"
                          className={styles.faqQuestion}
                          aria-expanded={isOpen}
                          aria-controls={`pdp-faq-answer-${i}`}
                          id={`pdp-faq-question-${i}`}
                          onClick={() => setOpenFaq(isOpen ? null : i)}
                        >
                          <span>{faq.question}</span>
                          <svg
                            className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ""}`}
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div
                            className={styles.faqAnswer}
                            id={`pdp-faq-answer-${i}`}
                            role="region"
                            aria-labelledby={`pdp-faq-question-${i}`}
                          >
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── AOV: curated bundle, then similar products (data-driven) ──── */}
        <FrequentlyBoughtTogether
          anchor={product}
          companions={bundle}
          onAddToCart={addToCart}
          currency="INR"
        />

        <RelatedProducts
          title="You May Also Like"
          products={relatedProducts}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
          isInWishlist={isInWishlist}
        />
      </div>

      {/* ── Sticky mobile Add-to-Cart (mobile-first) ──────────────────────── */}
      <AddToCartBar
        anchorRef={buyBoxRef}
        price={currentPrice}
        comparePrice={comparePrice}
        currency="INR"
        image={product.images?.[0] || product.image}
        name={selectedVariant?.name || product.name}
        disabled={isOutOfStock}
        onAddToCart={handleAddClick}
        onBuyNow={handleBuyNow}
      />
    </motion.div>
  );
};

export default ProductDetails;
