import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../hooks/useAuth";
import apiService from "../../services/api";
import {
  formatCurrency,
  formatDate,
  normalizeOrderAddress,
  onImageError,
  PLACEHOLDER_IMG,
} from "../../utils/helpers";
import ReviewModal from "../../components/ReviewModal/ReviewModal";
import styles from "./OrderHistory.module.css";

// Short, privacy-friendly display name for a review, e.g. "Bappi D." — matches
// the style of the seeded reviews.
const reviewDisplayName = (user) => {
  const first = user?.firstName?.trim() || "";
  const last = user?.lastName?.trim() || "";
  if (first && last) return `${first} ${last[0].toUpperCase()}.`;
  return first || user?.email?.split("@")[0] || "Customer";
};

// SweetAlert2 takes a colour VALUE, not a token — it renders outside the React
// tree, and a per-call confirmButtonColor is set as an inline variable on the
// button (see the Swal block in App.css). This mirrors --sf-color-danger from
// storefront-tokens.css; keep the two in sync if that token is ever retuned.
const DANGER_HEX = "#9E3B2E";

const REVIEW_STATUS = {
  pending: { label: "Review pending approval", className: "reviewPending" },
  approved: { label: "Review published", className: "reviewApproved" },
  rejected: { label: "Review not approved", className: "reviewRejected" },
};

const STATUS_CONFIG = {
  processing: { label: "Processing", className: "statusProcessing" },
  shipped: { label: "Shipped", className: "statusShipped" },
  delivered: { label: "Delivered", className: "statusDelivered" },
  cancelled: { label: "Cancelled", className: "statusCancelled" },
  returned: { label: "Returned", className: "statusCancelled" },
  pending: { label: "Processing", className: "statusProcessing" },
  completed: { label: "Delivered", className: "statusDelivered" },
  failed: { label: "Cancelled", className: "statusCancelled" },
  refunded: { label: "Cancelled", className: "statusCancelled" },
};

const FILTER_OPTIONS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];
const ORDERS_PER_PAGE = 5;
const RETURN_WINDOW_DAYS = 7; // per the 7-day return policy (see /refund-policy)
const TIMELINE_STEPS = ["Placed", "Shipped", "Delivered"];

// Orders carry paymentStatus / fulfillmentStatus / shippingStatus (the shape
// checkout writes and Admin manages) — collapse those into the single display
// status this page badges and filters by. A legacy `status` field is only
// honoured when none of the canonical fields exist.
const deriveOrderStatus = (order) => {
  if (order.paymentStatus || order.fulfillmentStatus || order.shippingStatus) {
    // A returned order is its own outcome — show it honestly rather than
    // collapsing it into "Cancelled" (full refund) or "Delivered" (partial).
    if (order.fulfillmentStatus === "returned") return "returned";
    if (
      order.fulfillmentStatus === "cancelled" ||
      order.paymentStatus === "failed" ||
      order.paymentStatus === "refunded"
    ) {
      return "cancelled";
    }
    if (order.shippingStatus === "delivered") return "delivered";
    if (order.shippingStatus === "shipped") return "shipped";
    return "processing";
  }
  return order.status || "processing";
};

/* ------------------------------------------------------------------ */
/*  Marks — hairline line art, never a filled icon                     */
/* ------------------------------------------------------------------ */

const Stroke = ({ size = 16, width = 1.5, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

const IconRefresh = (props) => (
  <Stroke {...props}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </Stroke>
);

const IconSearch = (props) => (
  <Stroke {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Stroke>
);

const IconClose = (props) => (
  <Stroke {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Stroke>
);

const IconCopy = (props) => (
  <Stroke {...props}>
    <rect x="9" y="9" width="12" height="12" rx="1.5" />
    <path d="M5 15H4a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 014 3h9A1.5 1.5 0 0114.5 4.5V5" />
  </Stroke>
);

const IconCheck = (props) => (
  <Stroke {...props}>
    <polyline points="20 6 9 17 4 12" />
  </Stroke>
);

const IconChevron = (props) => (
  <Stroke {...props}>
    <polyline points="6 9 12 15 18 9" />
  </Stroke>
);

const IconExternal = (props) => (
  <Stroke {...props}>
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </Stroke>
);

const IconStar = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <polygon points="12 2.6 14.9 9 21.6 9.6 16.5 14.1 18 20.8 12 17.3 6 20.8 7.5 14.1 2.4 9.6 9.1 9" />
  </svg>
);

// The ledger mark — a bound page with three ruled lines and one gold rule.
const LedgerMark = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M18 10h30a4 4 0 014 4v48l-7-4-6 4-6-4-6 4-6-4-7 4V14a4 4 0 014-4z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <line x1="26" y1="26" x2="46" y2="26" stroke="currentColor" strokeWidth="1.2" />
    <line x1="26" y1="34" x2="46" y2="34" stroke="currentColor" strokeWidth="1.2" />
    <line
      x1="26"
      y1="42"
      x2="38"
      y2="42"
      stroke="var(--sf-color-gold)"
      strokeWidth="1.2"
    />
  </svg>
);

// The signed-out mark — the same bound page, closed, with a gold keyhole.
const SealedMark = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" focusable="false">
    <rect
      x="16"
      y="10"
      width="40"
      height="52"
      rx="4"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M29 34v-5a7 7 0 0114 0v5"
      stroke="var(--sf-color-gold)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <rect
      x="26"
      y="34"
      width="20"
      height="15"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const AlertMark = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="1.2" />
    <line x1="32" y1="21" x2="32" y2="35" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="32" cy="42" r="1.4" fill="currentColor" />
  </svg>
);

const OrderHistory = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { addToCart, setIsCartOpen } = useCart();
  const { user, isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingVisible, setTrackingVisible] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reviews authored by this customer (any status), keyed by productId for the
  // per-item "your review" state, plus the rate/review modal.
  const [myReviews, setMyReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState({ open: false, product: null, existing: null, orderId: null, orderNumber: null });

  useEffect(() => {
    if (authLoading) return; // session restore in progress — keep the loader up
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const fetchOrders = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [response, reviews] = await Promise.all([
        apiService.orders.getByUserId(user?.id),
        apiService.reviews.getMine(user?.id).catch(() => []),
      ]);
      const data = Array.isArray(response) ? response : response?.data || response?.orders || [];
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
      setMyReviews(Array.isArray(reviews) ? reviews : []);
    } catch (err) {
      // Keep "No orders yet" honest: a failed fetch renders the error state,
      // never the empty state.
      console.error("Failed to fetch orders:", err);
      setOrders([]);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Clipboard access can be refused (an unfocused document, a denied
      // permission). Stay silent rather than claim a copy that never happened.
      console.error("Couldn't copy to clipboard:", err);
    }
  };

  const getStatusInfo = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.processing;
  };

  const isReturnEligible = (order) => {
    if (deriveOrderStatus(order) !== "delivered") return false;
    // The window starts when the parcel arrived: deliveredAt when recorded,
    // else updatedAt (bumped by the delivered status change) — never
    // createdAt, which would open the window before delivery.
    const deliveredOn = order.deliveredAt || order.updatedAt;
    if (!deliveredOn) return false;
    const daysSinceDelivery = (Date.now() - new Date(deliveredOn).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDelivery <= RETURN_WINDOW_DAYS;
  };

  // Orders can be cancelled until they ship — i.e. while the derived status
  // is still "processing" (covers pending-payment and unfulfilled orders).
  const isCancellable = (order) => deriveOrderStatus(order) === "processing";

  // Purchase-gated reviews: a product is reviewable only from an order the
  // customer kept — derived status "delivered" (delivered, and NOT cancelled,
  // returned or refunded).
  const isReviewable = (order) => deriveOrderStatus(order) === "delivered";

  // Reorder re-adds the order's lines through the cart. An item can only be
  // re-added when it carries a productId (the key the cart lines on). We don't
  // fabricate stock — items without a productId are skipped and reported.
  const reorderableItems = (order) =>
    (order.items || []).filter((it) => it.productId != null);

  const handleReorder = async (order) => {
    if (reorderingId) return;
    const items = order.items || [];
    const addable = reorderableItems(order);
    const skipped = items.length - addable.length;

    if (addable.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Couldn't reorder",
        text: "These items are no longer available to add to your cart.",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    setReorderingId(order.id);
    try {
      // Funnel each line through CartContext (no direct cart mutation). Keep the
      // drawer closed per-add so it doesn't flash; we open it once at the end.
      for (const it of addable) {
        // eslint-disable-next-line no-await-in-loop
        await addToCart(
          {
            productId: it.productId,
            variantId: it.variantId ?? null,
            variantName: it.variantName ?? null,
            name: it.name,
            image: it.image,
            price: it.price,
            currency: it.currency,
          },
          it.quantity || 1,
          { openDrawer: false }
        );
      }
      setIsCartOpen(true);
      Swal.fire({
        icon: "success",
        title: "Added to cart",
        text:
          skipped > 0
            ? `${addable.length} item${addable.length !== 1 ? "s" : ""} added — ${skipped} couldn't be re-added.`
            : `${addable.length} item${addable.length !== 1 ? "s" : ""} added to your cart.`,
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Failed to reorder:", err);
      Swal.fire({
        icon: "error",
        title: "Couldn't reorder",
        text: "Something went wrong adding these items. Please try again.",
      });
    } finally {
      setReorderingId(null);
    }
  };

  // The customer's existing review for a product (if any), to drive the
  // edit flow and the "your review" status chip.
  const reviewFor = (productId) =>
    myReviews.find((r) => Number(r.productId) === Number(productId)) || null;

  const openReviewModal = (order, item) => {
    setReviewModal({
      open: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      product: { productId: item.productId, name: item.name, image: item.image },
      existing: reviewFor(item.productId),
    });
  };

  const closeReviewModal = () => setReviewModal((m) => ({ ...m, open: false }));

  const handleSubmitReview = async ({ rating, title, body }) => {
    const { product, existing, orderId, orderNumber } = reviewModal;
    await apiService.reviews.submit({
      productId: product.productId,
      userId: user.id,
      userName: reviewDisplayName(user),
      rating,
      title,
      body,
      orderId,
      orderNumber,
      isVerifiedPurchase: true,
    });
    // Refresh the customer's reviews so the chip reflects the new pending state.
    const refreshed = await apiService.reviews.getMine(user.id).catch(() => myReviews);
    setMyReviews(Array.isArray(refreshed) ? refreshed : []);
    closeReviewModal();
    Swal.fire({
      icon: "success",
      title: existing ? "Review updated" : "Review submitted",
      text: "Thanks! Your review will appear on the product page once it's approved.",
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const handleCancelOrder = async (order) => {
    if (cancellingId) return;
    // Payment-aware messaging: a prepaid order gets a refund; a COD order has
    // nothing collected yet, so there's nothing to refund.
    const isOnline = order.paymentMethod && order.paymentMethod !== "cod";
    const captured = ["paid", "partially_refunded"].includes(order.paymentStatus);
    const refundLine = captured
      ? ` A full refund of ${formatCurrency(order.total)} will be initiated to your ${isOnline ? "original payment method" : "bank / UPI"}.`
      : " No payment has been collected, so there's nothing to refund.";
    const result = await Swal.fire({
      title: "Cancel this order?",
      html: `Order <strong>${order.orderNumber || `#${order.id}`}</strong> will be cancelled.${refundLine}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: DANGER_HEX,
      confirmButtonText: "Cancel Order",
      cancelButtonText: "Keep Order",
    });
    if (!result.isConfirmed) return;

    setCancellingId(order.id);
    try {
      const updated = await apiService.orders.cancel(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o))
      );
    } catch (err) {
      console.error("Failed to cancel order:", err);
      Swal.fire({
        icon: "error",
        title: "Couldn't cancel order",
        text: "Something went wrong while cancelling. Please try again.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const statusInfo = getStatusInfo(deriveOrderStatus(order));
    const matchesFilter =
      activeFilter === "All" ||
      statusInfo.label.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (order.orderNumber || order.id || "")
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // Keep the page in range when the result set shrinks (e.g. after a refresh).
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // The page shell, so every state below is framed the same way.
  const shell = (children) => (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>{children}</div>
    </div>
  );

  // A copy control: the word, then the check in gold once it has been copied.
  const copyControl = (text, label) => (
    <button
      type="button"
      className={`${styles.copyBtn} ${copiedId === text ? styles.copyBtnDone : ""}`}
      onClick={() => handleCopy(text)}
      aria-label={copiedId === text ? `Copied ${label}` : `Copy ${label}`}
    >
      {copiedId === text ? (
        <>
          <IconCheck size={13} width={2} />
          Copied
        </>
      ) : (
        <>
          <IconCopy size={13} />
          Copy
        </>
      )}
    </button>
  );

  const statusChip = (statusInfo) => (
    <span className={`${styles.chip} ${styles[statusInfo.className]}`}>
      <span className={styles.chipDot} aria-hidden="true" />
      {statusInfo.label}
    </span>
  );

  // Not authenticated — show the sign-in invitation (only once the session
  // restore has settled, so a reload while logged in doesn't flash this screen)
  if (!authLoading && !isAuthenticated) {
    return shell(
      <div className={styles.state}>
        <div className={styles.stateMark}>
          <SealedMark />
        </div>
        <p className={styles.stateEyebrow}>Your account</p>
        <h1 className={styles.stateTitle}>Your orders live here</h1>
        <p className={styles.stateText}>
          Sign in and every piece you have ordered — placed, on its way or
          delivered — is waiting on this page, with its tracking and its papers.
        </p>
        <div className={styles.stateActions}>
          <button
            type="button"
            className={`sf-btn sf-btn--emerald ${styles.stateBtn}`}
            onClick={() => openAuthModal("login")}
          >
            Sign In
          </button>
          <Link to="/" className={`sf-btn sf-btn--ghost ${styles.stateBtn}`}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        {/* ── The head ─────────────────────────────────────────────────── */}
        <header className={styles.head}>
          <div className={styles.headText}>
            <p className={styles.eyebrow}>Your account</p>
            <h1 className={styles.title}>Order History</h1>
            {!loading && !fetchError && (
              <p className={styles.countLine}>
                {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
                {activeFilter !== "All" || searchQuery ? " matching" : " on record"}.
              </p>
            )}
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchOrders}
            disabled={loading}
            aria-label="Refresh orders"
            title="Refresh orders"
          >
            <IconRefresh size={16} className={loading ? styles.spinning : undefined} />
          </button>
        </header>

        {/* ── Search & filters ─────────────────────────────────────────── */}
        <div className={styles.controls}>
          <div className={styles.search}>
            <IconSearch size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by order number"
              aria-label="Search by order number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <IconClose size={15} />
              </button>
            )}
          </div>
          <div className={styles.tabs} role="group" aria-label="Filter orders by status">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`sf-chip ${styles.tab} ${activeFilter === filter ? "sf-chip--active" : ""}`}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading — the list's own silhouette ──────────────────────── */}
        {loading && (
          <div className={styles.skeletonList} aria-busy="true" aria-live="polite">
            <p className={styles.srOnly}>Loading your orders…</p>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonRow}>
                  <span
                    className={`sf-skeleton ${styles.skeletonLine}`}
                    style={{ width: "11rem" }}
                  />
                  <span
                    className={`sf-skeleton ${styles.skeletonLine}`}
                    style={{ width: "6rem", marginLeft: "auto" }}
                  />
                </div>
                <div className={styles.skeletonRow}>
                  <span className={`sf-skeleton ${styles.skeletonPlate}`} />
                  <span className={`sf-skeleton ${styles.skeletonPlate}`} />
                  <span
                    className={`sf-skeleton ${styles.skeletonLine}`}
                    style={{ width: "7rem", marginLeft: "auto" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Error — a failed fetch never masquerades as an empty ledger ── */}
        {!loading && fetchError && (
          <div className={styles.state}>
            <div className={styles.stateMark}>
              <AlertMark />
            </div>
            <h2 className={styles.stateTitle}>We couldn't reach your orders</h2>
            <p className={styles.stateText}>
              Something went wrong while fetching them. Check your connection and
              try again — nothing has been lost.
            </p>
            <div className={styles.stateActions}>
              <button
                type="button"
                className={`sf-btn sf-btn--emerald ${styles.stateBtn}`}
                onClick={fetchOrders}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────────────────── */}
        {!loading && !fetchError && filteredOrders.length === 0 && orders.length === 0 && (
          <div className={styles.state}>
            <div className={styles.stateMark}>
              <LedgerMark />
            </div>
            <h2 className={styles.stateTitle}>No orders yet</h2>
            <p className={styles.stateText}>
              Your ledger opens with the first piece you take home. Muga, Pat and
              Eri — woven in Assam, and waiting.
            </p>
            <div className={styles.stateActions}>
              <button
                type="button"
                className={`sf-btn sf-btn--emerald ${styles.stateBtn}`}
                onClick={() => navigate("/")}
              >
                Start Shopping
              </button>
            </div>
          </div>
        )}

        {/* ── No matches ──────────────────────────────────────────────── */}
        {!loading && !fetchError && filteredOrders.length === 0 && orders.length > 0 && (
          <div className={styles.state}>
            <h2 className={styles.stateTitle}>No matching orders</h2>
            <p className={styles.stateText}>
              Nothing on record answers to that search or filter. Widen it and
              your orders come back.
            </p>
            <div className={styles.stateActions}>
              <button
                type="button"
                className={`sf-btn sf-btn--outline-gold ${styles.stateBtn}`}
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* ── The records ─────────────────────────────────────────────── */}
        {!loading && paginatedOrders.length > 0 && (
          <div className={styles.list}>
            {paginatedOrders.map((order, index) => {
              const derived = deriveOrderStatus(order);
              const statusInfo = getStatusInfo(derived);
              const orderItems = order.items || [];
              const orderKey = order.id || order.orderNumber;
              const orderRef = order.orderNumber || `#${order.id}`;
              const copyRef = order.orderNumber || order.id;
              const visibleItems = orderItems.slice(0, 3);
              const remainingCount = orderItems.length - 3;
              const isExpanded = expandedOrder === orderKey;
              const showTracking = trackingVisible === orderKey;
              const showPassage = derived !== "cancelled" && derived !== "returned";
              const stageIndex = derived === "delivered" ? 2 : derived === "shipped" ? 1 : 0;
              const addr = normalizeOrderAddress(order.shippingAddress);
              const canReorder = reorderableItems(order).length > 0;

              return (
                <article
                  key={orderKey}
                  className={styles.record}
                  style={{ animationDelay: `${Math.min(index, 4) * 60}ms` }}
                  aria-label={`Order ${orderRef}`}
                >
                  {/* Identity */}
                  <div className={styles.recordHead}>
                    <div className={styles.identity}>
                      <div className={styles.numberRow}>
                        <span className={styles.number}>{orderRef}</span>
                        {copyControl(copyRef, "order number")}
                      </div>
                      <p className={styles.meta}>
                        {formatDate(order.createdAt)}
                        <span className={styles.metaSep} aria-hidden="true">
                          /
                        </span>
                        {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {statusChip(statusInfo)}
                  </div>

                  {/* The pieces, and the total */}
                  <div className={styles.pieces}>
                    <div className={styles.plates}>
                      {visibleItems.map((item, i) => (
                        <span key={i} className={styles.plate}>
                          <img
                            src={item.image || PLACEHOLDER_IMG}
                            alt={item.name || "Product"}
                            loading="lazy"
                            onError={onImageError}
                          />
                        </span>
                      ))}
                      {remainingCount > 0 && (
                        <span className={styles.plateMore}>+{remainingCount} more</span>
                      )}
                    </div>
                    <p className={styles.total}>
                      <span className={styles.totalLabel}>Total</span>
                      <span className={styles.totalValue}>{formatCurrency(order.total)}</span>
                    </p>
                  </div>

                  {/* The passage — hidden for a cancelled or returned order,
                      where the chip has already said the outcome. */}
                  {showPassage && (
                    <div className={styles.passage}>
                      <p className={styles.srOnly}>
                        {`Progress: stage ${stageIndex + 1} of 3. ` +
                          TIMELINE_STEPS.map(
                            (label, i) => `${label}: ${i <= stageIndex ? "done" : "not yet"}`
                          ).join(". ")}
                      </p>
                      <div className={styles.track} aria-hidden="true">
                        {TIMELINE_STEPS.map((label, i) => (
                          <React.Fragment key={label}>
                            {i > 0 && (
                              <span
                                className={`${styles.rail} ${i <= stageIndex ? styles.railDone : ""}`}
                              />
                            )}
                            <span className={styles.stage}>
                              <span
                                className={`${styles.node} ${i <= stageIndex ? styles.nodeDone : ""}`}
                              />
                              <span
                                className={`${styles.stageLabel} ${i <= stageIndex ? styles.stageLabelDone : ""}`}
                              >
                                {label}
                              </span>
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className={styles.actions}>
                    {isCancellable(order) && (
                      <button
                        type="button"
                        className={`${styles.action} ${styles.actionDanger}`}
                        onClick={() => handleCancelOrder(order)}
                        disabled={cancellingId !== null}
                      >
                        {cancellingId === order.id ? (
                          <>
                            <span className={styles.btnSpinner} aria-hidden="true" />
                            Cancelling…
                          </>
                        ) : (
                          "Cancel Order"
                        )}
                      </button>
                    )}
                    {isReturnEligible(order) && (
                      <button
                        type="button"
                        className={`${styles.action} ${styles.actionAccent}`}
                        onClick={() => navigate("/support")}
                      >
                        Return / Exchange
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.action}
                      onClick={() => handleReorder(order)}
                      disabled={reorderingId !== null || !canReorder}
                      title={
                        canReorder
                          ? "Add these items to your cart again"
                          : "These items can't be re-added to the cart"
                      }
                    >
                      {reorderingId === order.id ? (
                        <>
                          <span className={styles.btnSpinner} aria-hidden="true" />
                          Adding…
                        </>
                      ) : (
                        "Reorder"
                      )}
                    </button>
                    <button
                      type="button"
                      className={`${styles.action} ${showTracking ? styles.actionOpen : ""}`}
                      onClick={() => setTrackingVisible(showTracking ? null : orderKey)}
                      aria-expanded={showTracking}
                      aria-controls={`tracking-${orderKey}`}
                    >
                      Tracking
                      <IconChevron
                        size={14}
                        className={`${styles.chevron} ${showTracking ? styles.chevronUp : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      className={`${styles.action} ${isExpanded ? styles.actionOpen : ""}`}
                      onClick={() => setExpandedOrder(isExpanded ? null : orderKey)}
                      aria-expanded={isExpanded}
                      aria-controls={`details-${orderKey}`}
                    >
                      Details
                      <IconChevron
                        size={14}
                        className={`${styles.chevron} ${isExpanded ? styles.chevronUp : ""}`}
                      />
                    </button>
                  </div>

                  {/* Drawer — tracking */}
                  <div
                    id={`tracking-${orderKey}`}
                    className={`${styles.drawer} ${showTracking ? styles.drawerOpen : ""}`}
                  >
                    <div className={styles.drawerPane}>
                      <div className={styles.drawerInner}>
                        <div className={styles.trackRow}>
                          <span className={styles.trackLabel}>Tracking number</span>
                          {order.trackingNumber ? (
                            <>
                              <span className={`${styles.trackValue} ${styles.trackMono}`}>
                                {order.trackingNumber}
                              </span>
                              {copyControl(order.trackingNumber, "tracking number")}
                            </>
                          ) : (
                            <span className={`${styles.trackValue} ${styles.trackMuted}`}>
                              Not yet available
                            </span>
                          )}
                        </div>
                        {order.trackingUrl && (
                          <div className={styles.trackRow}>
                            <span className={styles.trackLabel}>Carrier</span>
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.trackLink}
                            >
                              <IconExternal size={14} />
                              Open carrier tracking page
                              <span className={styles.srOnly}>(opens in a new tab)</span>
                            </a>
                          </div>
                        )}
                        <div className={styles.trackRow}>
                          <span className={styles.trackLabel}>Status</span>
                          {statusChip(statusInfo)}
                        </div>
                        {order.refundStatus && (
                          <div className={styles.trackRow}>
                            <span className={styles.trackLabel}>Refund</span>
                            <span
                              className={`${styles.refundLine} ${
                                order.refundStatus === "completed"
                                  ? styles.refundOk
                                  : order.refundStatus === "processing"
                                  ? styles.refundPending
                                  : order.refundStatus === "failed"
                                  ? styles.refundFailed
                                  : ""
                              }`}
                            >
                              {order.refundStatus === "completed"
                                ? `Refunded${order.refundedAmount ? ` ${formatCurrency(order.refundedAmount)}` : ""} to your ${(order.refundMethod || "original payment").replace(/_/g, " ")}`
                                : order.refundStatus === "processing"
                                ? "Refund in progress — typically 5–7 business days"
                                : order.refundStatus === "failed"
                                ? "Refund delayed — our team is on it"
                                : order.refundStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Drawer — the full record */}
                  <div
                    id={`details-${orderKey}`}
                    className={`${styles.drawer} ${isExpanded ? styles.drawerOpen : ""}`}
                  >
                    <div className={styles.drawerPane}>
                      <div className={`${styles.drawerInner} ${styles.detailGrid}`}>
                        <div className={styles.detailCol}>
                          <section>
                            <h3 className={styles.blockTitle}>Items ordered</h3>
                            <ul className={styles.lines}>
                              {orderItems.map((item, i) => {
                                const existing =
                                  item.productId != null ? reviewFor(item.productId) : null;
                                const sc = existing ? REVIEW_STATUS[existing.status] : null;
                                return (
                                  <li key={i} className={styles.line}>
                                    <span className={styles.lineThumb}>
                                      <img
                                        src={item.image || PLACEHOLDER_IMG}
                                        alt={item.name || "Product"}
                                        loading="lazy"
                                        onError={onImageError}
                                      />
                                    </span>
                                    <div className={styles.lineBody}>
                                      <p className={styles.lineName}>{item.name}</p>
                                      {item.variantName && (
                                        <span className={styles.lineVariant}>
                                          {item.variantName}
                                        </span>
                                      )}
                                      <span className={styles.lineQty}>
                                        Qty {item.quantity}
                                      </span>
                                      {isReviewable(order) && item.productId != null && (
                                        <div className={styles.reviewControl}>
                                          <button
                                            type="button"
                                            className={styles.reviewBtn}
                                            onClick={() => openReviewModal(order, item)}
                                          >
                                            <span className={styles.reviewStar}>
                                              <IconStar />
                                            </span>
                                            {existing ? "Edit review" : "Rate & review"}
                                          </button>
                                          {existing && sc && (
                                            <span
                                              className={`${styles.chip} ${styles[sc.className]}`}
                                            >
                                              <span
                                                className={styles.chipDot}
                                                aria-hidden="true"
                                              />
                                              {sc.label}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <span className={styles.linePrice}>
                                      {formatCurrency(item.price * item.quantity, item.currency)}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </section>
                        </div>

                        <div className={styles.detailCol}>
                          <section>
                            <h3 className={styles.blockTitle}>Shipping address</h3>
                            {addr ? (
                              <>
                                {addr.name && <p className={styles.addrName}>{addr.name}</p>}
                                {addr.line1 && <p className={styles.addrLine}>{addr.line1}</p>}
                                {addr.line2 && <p className={styles.addrLine}>{addr.line2}</p>}
                                {addr.cityLine && (
                                  <p className={styles.addrLine}>{addr.cityLine}</p>
                                )}
                                {addr.country && <p className={styles.addrLine}>{addr.country}</p>}
                                {addr.phone && <p className={styles.addrPhone}>{addr.phone}</p>}
                              </>
                            ) : (
                              <p className={styles.muted}>Shipping address not available</p>
                            )}
                          </section>

                          <section>
                            <h3 className={styles.blockTitle}>Payment</h3>
                            <p className={styles.payMethod}>
                              {order.paymentMethod
                                ? order.paymentMethod.replace(/_/g, " ").toUpperCase()
                                : "N/A"}
                            </p>
                            {order.paymentStatus && (
                              <p className={styles.muted}>
                                Status: {order.paymentStatus.replace(/_/g, " ")}
                              </p>
                            )}
                          </section>

                          <section>
                            <h3 className={styles.blockTitle}>Order summary</h3>
                            <dl className={styles.ledger}>
                              <div className={styles.ledgerRow}>
                                <dt>Subtotal</dt>
                                <dd>{formatCurrency(order.subtotal)}</dd>
                              </div>
                              {(order.discountAmount ?? 0) > 0 && (
                                <div className={`${styles.ledgerRow} ${styles.ledgerDiscount}`}>
                                  <dt>
                                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                                  </dt>
                                  <dd>-{formatCurrency(order.discountAmount)}</dd>
                                </div>
                              )}
                              <div className={styles.ledgerRow}>
                                <dt>Shipping</dt>
                                <dd>
                                  {(order.shippingAmount ?? order.shipping ?? 0) > 0
                                    ? formatCurrency(order.shippingAmount ?? order.shipping)
                                    : "FREE"}
                                </dd>
                              </div>
                              <div className={styles.ledgerRow}>
                                <dt>Tax</dt>
                                <dd>{formatCurrency(order.taxAmount ?? order.tax ?? 0)}</dd>
                              </div>
                              <div className={`${styles.ledgerRow} ${styles.ledgerTotal}`}>
                                <dt>Total</dt>
                                <dd>{formatCurrency(order.total)}</dd>
                              </div>
                            </dl>
                          </section>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ── The pager ───────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <nav className={styles.pager} aria-label="Order history pages">
            <div className={styles.pagerRow}>
              <button
                type="button"
                className={styles.pagerStep}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <IconChevron size={14} style={{ transform: "rotate(90deg)" }} />
                Prev
              </button>
              <div className={styles.pagerNums}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`${styles.pagerNum} ${currentPage === page ? styles.pagerNumActive : ""}`}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.pagerStep}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                Next
                <IconChevron size={14} style={{ transform: "rotate(-90deg)" }} />
              </button>
            </div>
            <p className={styles.pagerInfo}>
              Page {currentPage} of {totalPages}
            </p>
          </nav>
        )}
      </div>

      <ReviewModal
        open={reviewModal.open}
        onClose={closeReviewModal}
        product={reviewModal.product}
        existing={reviewModal.existing}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

export default OrderHistory;
