import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../context/WishlistContext";
import apiService from "../../services/api";
import { formatDate, formatCurrency, getInitials, generateId, isValidPhone } from "../../utils/helpers";
import styles from "./Profile.module.css";

// Orders carry paymentStatus / fulfillmentStatus / shippingStatus (the shape
// checkout writes and Admin manages) — collapse those into the single display
// status the Recent Orders list badges by, mirroring Order History so the two
// screens never disagree. A legacy `status` field is only honoured when none of
// the canonical fields exist.
const deriveOrderStatus = (order) => {
  if (order.paymentStatus || order.fulfillmentStatus || order.shippingStatus) {
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

const STATUS_CONFIG = {
  processing: { label: "Processing", className: "statusProcessing" },
  shipped: { label: "Shipped", className: "statusShipped" },
  delivered: { label: "Delivered", className: "statusDelivered" },
  cancelled: { label: "Cancelled", className: "statusCancelled" },
  returned: { label: "Returned", className: "statusCancelled" },
};

const getStatusInfo = (order) =>
  STATUS_CONFIG[deriveOrderStatus(order)] || STATUS_CONFIG.processing;

// Only render a membership badge when it's real or derivable from the user
// object. The seeded user shape carries no membership/tier field, so we never
// fabricate a paid "Premium" tier for everyone — we fall back to a neutral
// "Member" badge. The moment a real flag appears on the user, the gold
// "Premium Member" badge lights up automatically.
const getMembership = (user) => {
  const isPremium =
    !!user?.isPremium ||
    user?.membershipTier === "premium" ||
    (typeof user?.tier === "string" && user.tier.toLowerCase() === "premium");
  if (isPremium) return { label: "Premium Member", premium: true };
  return { label: "Member", premium: false };
};

// ---- Inline icon set (stroke = currentColor so the coloured tiles tint them) ----
const Icon = ({ name }) => {
  const icons = {
    orders: (
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0" />
    ),
    location: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    card: (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </>
    ),
    wallet: (
      <>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    heart: (
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    chevron: <polyline points="9 18 15 12 9 6" />,
    back: <polyline points="15 18 9 12 15 6" />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    person: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || null}
    </svg>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser, openAuthModal } = useAuth();
  const { wishlistItems } = useWishlist();

  // null = dashboard (header + stats + menu + recent orders + logout).
  // Otherwise one of: profile | addresses | payment | wallet | notifications | settings
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Account stats + recent orders (read-only fetches; real data only)
  const [orders, setOrders] = useState([]);
  const [reviewsCount, setReviewsCount] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Store-credit wallet
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTx, setWalletTx] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({
    id: null,
    label: "Home",
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });

  // Populate form data from user
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setAddresses(user.addresses || []);
    }
  }, [user]);

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Load account stats (orders + reviews) once the user is known. Orders feed
  // both the Orders stat tile and the Recent Orders list; reviews feed the
  // Reviews tile. Counts are honest: 0 when empty, "—" while loading, and a
  // failed fetch leaves the tiles at 0 rather than inventing numbers.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      setStatsLoading(true);
      try {
        const [orderRes, reviewRes] = await Promise.all([
          apiService.orders.getByUserId(user.id),
          apiService.reviews.getMine(user.id).catch(() => []),
        ]);
        const orderData = Array.isArray(orderRes)
          ? orderRes
          : orderRes?.data || orderRes?.orders || [];
        const sorted = [...orderData].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        if (active) {
          setOrders(sorted);
          setReviewsCount(Array.isArray(reviewRes) ? reviewRes.length : 0);
        }
      } catch (e) {
        console.error("Load account stats error:", e);
        if (active) {
          setOrders([]);
          setReviewsCount(0);
        }
      } finally {
        if (active) setStatsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Load wallet balance + ledger when the Store Credit section is opened (fresh
  // from the API, so a refund issued by the admin in another session shows up).
  useEffect(() => {
    if (activeSection !== "wallet" || !user?.id) return;
    let active = true;
    (async () => {
      setWalletLoading(true);
      try {
        const [bal, tx] = await Promise.all([
          apiService.wallet.getBalance(user.id),
          apiService.wallet.getTransactions(user.id),
        ]);
        if (active) {
          setWalletBalance(Number(bal) || 0);
          setWalletTx(Array.isArray(tx) ? tx : []);
        }
      } catch (e) {
        console.error("Load wallet error:", e);
      } finally {
        if (active) setWalletLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeSection, user]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  const openSection = (section) => {
    setActiveSection(section);
    setFeedback({ type: "", message: "" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToDashboard = () => {
    setActiveSection(null);
    resetAddressForm();
    setFeedback({ type: "", message: "" });
  };

  // ---- Profile handlers ----
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      showFeedback("error", "First name and last name are required.");
      return;
    }
    if (profileForm.phone && !isValidPhone(profileForm.phone)) {
      showFeedback("error", "Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      await updateUser({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
      });
      showFeedback("success", "Profile updated successfully.");
    } catch (err) {
      showFeedback("error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Password handlers ----
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: "", key: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: "Weak", key: "weak" };
    if (score <= 4) return { level: 2, label: "Fair", key: "fair" };
    if (score <= 5) return { level: 3, label: "Good", key: "good" };
    return { level: 4, label: "Strong", key: "strong" };
  };

  const handlePasswordSubmit = async () => {
    if (!passwordForm.currentPassword) {
      showFeedback("error", "Please enter your current password.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showFeedback("error", "New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showFeedback("error", "New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiService.auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswords({ current: false, new: false, confirm: false });
      showFeedback("success", "Password updated successfully.");
    } catch (err) {
      showFeedback("error", "Failed to change password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Address handlers ----
  const resetAddressForm = () => {
    setAddressForm({
      id: null,
      label: "Home",
      firstName: "",
      lastName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      isDefault: false,
    });
    setShowAddressForm(false);
    setEditingAddressIndex(null);
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddressSave = async () => {
    if (
      !addressForm.firstName.trim() ||
      !addressForm.lastName.trim() ||
      !addressForm.addressLine1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.postalCode.trim()
    ) {
      showFeedback("error", "Please fill in all required address fields.");
      return;
    }
    if (!isValidPhone(addressForm.phone)) {
      showFeedback("error", "Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      // Persist the canonical shape (firstName/lastName/postalCode + a stable
      // id) so the row round-trips with Checkout, Orders and db.json. New rows
      // get an id; edited rows keep theirs.
      const isFirst = addresses.length === 0;
      const entry = {
        ...addressForm,
        id: addressForm.id || generateId(),
        firstName: addressForm.firstName.trim(),
        lastName: addressForm.lastName.trim(),
        phone: addressForm.phone.trim(),
        country: addressForm.country || "India",
        // The first address is always the default; otherwise honour the box.
        isDefault: isFirst ? true : addressForm.isDefault,
      };

      let updatedAddresses = [...addresses];
      // "Default" is exclusive — clear it everywhere else before applying.
      if (entry.isDefault) {
        updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
      }
      if (editingAddressIndex !== null) {
        updatedAddresses[editingAddressIndex] = entry;
      } else {
        updatedAddresses.push(entry);
      }
      // Guard against zero defaults (e.g. un-checking default on the only row):
      // there must always be exactly one when addresses exist.
      if (updatedAddresses.length > 0 && !updatedAddresses.some((a) => a.isDefault)) {
        updatedAddresses[0] = { ...updatedAddresses[0], isDefault: true };
      }

      await updateUser({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      resetAddressForm();
      showFeedback(
        "success",
        editingAddressIndex !== null ? "Address updated successfully." : "Address added successfully."
      );
    } catch (err) {
      showFeedback("error", "Failed to save address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressEdit = (index) => {
    const a = addresses[index] || {};
    // Normalise any legacy row (single fullName / zipCode) into the canonical
    // form shape so an edit always writes firstName/lastName/postalCode back.
    const [firstFromFull, ...restFromFull] = (a.fullName || "").trim().split(/\s+/);
    setAddressForm({
      id: a.id || null,
      label: a.label || "Home",
      firstName: a.firstName || firstFromFull || "",
      lastName: a.lastName || restFromFull.join(" ") || "",
      phone: a.phone || "",
      addressLine1: a.addressLine1 || "",
      addressLine2: a.addressLine2 || "",
      city: a.city || "",
      state: a.state || "",
      postalCode: a.postalCode || a.zipCode || "",
      country: a.country || "India",
      isDefault: !!a.isDefault,
    });
    setEditingAddressIndex(index);
    setShowAddressForm(true);
  };

  const handleAddressDelete = async (index) => {
    const result = await Swal.fire({
      title: "Delete this address?",
      text: "This address will be removed from your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
      cancelButtonText: "Keep",
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const removedDefault = addresses[index]?.isDefault;
      let updatedAddresses = addresses.filter((_, i) => i !== index);
      // Deleting the default promotes the next remaining address (immutably —
      // never mutate the shared objects still referenced by state).
      if (removedDefault && updatedAddresses.length > 0) {
        updatedAddresses = updatedAddresses.map((a, i) => ({ ...a, isDefault: i === 0 }));
      }
      await updateUser({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      // If we were editing the row we just deleted, drop the open form.
      if (editingAddressIndex === index) resetAddressForm();
      showFeedback("success", "Address deleted successfully.");
    } catch (err) {
      showFeedback("error", "Failed to delete address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (index) => {
    setLoading(true);
    try {
      const updatedAddresses = addresses.map((a, i) => ({
        ...a,
        isDefault: i === index,
      }));
      await updateUser({ addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      showFeedback("success", "Default address updated.");
    } catch (err) {
      showFeedback("error", "Failed to update default address.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Logout handler ----
  const handleLogout = async () => {
    // Confirm first so logging out isn't a one-click accident.
    const result = await Swal.fire({
      title: "Log out?",
      text: "You'll need to sign in again to access your account.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Log Out",
      cancelButtonText: "Stay Signed In",
    });
    if (!result.isConfirmed) return;

    try {
      await logout();
      navigate("/");
    } catch (err) {
      showFeedback("error", "Logout failed. Please try again.");
    }
  };

  // ---- Logged-out guard ----
  // While the session restore is still settling, render nothing so the account
  // UI never flashes before we know who (if anyone) is signed in.
  if (authLoading) return null;

  // Settled and not signed in → a branded prompt that opens the AuthModal, with
  // a navigation fallback if the customer dismisses it.
  if (!isAuthenticated || !user) {
    return (
      <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
        <div className={styles.container}>
          <motion.div
            className={styles.loginPrompt}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.loginIcon}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className={styles.loginTitle}>Sign in to view your account</h2>
            <p className={styles.loginSubtext}>
              Access your orders, addresses, store credit and more once you sign in.
            </p>
            <div className={styles.loginActions}>
              <button className={styles.btnPrimary} onClick={() => openAuthModal("login")}>
                Log In
              </button>
              <button className={styles.linkSecondary} onClick={() => navigate("/")}>
                Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const membership = getMembership(user);
  const passwordStrength = getPasswordStrength(passwordForm.newPassword);
  const recentOrders = orders.slice(0, 3);

  const statValue = (count) => (statsLoading ? "—" : count);

  // ---- Menu rows (each opens an in-page section or navigates) ----
  const menuRows = [
    {
      id: "orders",
      icon: "orders",
      tone: "teal",
      label: "My Orders",
      sub: "Track, return or buy again",
      badge: !statsLoading && orders.length > 0 ? orders.length : null,
      onClick: () => navigate("/orders"),
    },
    {
      id: "addresses",
      icon: "location",
      tone: "blue",
      label: "Addresses",
      sub: "Manage delivery addresses",
      onClick: () => openSection("addresses"),
    },
    {
      id: "payment",
      icon: "card",
      tone: "purple",
      label: "Payment Methods",
      sub: "Saved cards & UPI",
      onClick: () => openSection("payment"),
    },
    {
      id: "wallet",
      icon: "wallet",
      tone: "orange",
      label: "Store Credit",
      sub: "Wallet balance & history",
      onClick: () => openSection("wallet"),
    },
    {
      id: "notifications",
      icon: "bell",
      tone: "pink",
      label: "Notifications",
      sub: "Offers, updates & more",
      onClick: () => openSection("notifications"),
    },
    {
      id: "settings",
      icon: "settings",
      tone: "red",
      label: "Settings",
      sub: "Password, appearance & privacy",
      onClick: () => openSection("settings"),
    },
  ];

  // =====================================================================
  // Section renderers (reachable from the menu / header card)
  // =====================================================================
  const renderProfileSection = () => (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <p className={styles.sectionSubtitle}>Manage your personal details</p>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="pf-first">First Name *</label>
          <input
            id="pf-first"
            type="text"
            name="firstName"
            value={profileForm.firstName}
            onChange={handleProfileChange}
            className={styles.formInput}
            placeholder="Enter first name"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="pf-last">Last Name *</label>
          <input
            id="pf-last"
            type="text"
            name="lastName"
            value={profileForm.lastName}
            onChange={handleProfileChange}
            className={styles.formInput}
            placeholder="Enter last name"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="pf-email">Email Address</label>
          <input
            id="pf-email"
            type="email"
            name="email"
            value={profileForm.email}
            className={`${styles.formInput} ${styles.readOnly}`}
            readOnly
          />
          <span className={styles.fieldHint}>Email cannot be changed</span>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="pf-phone">Phone Number</label>
          <input
            id="pf-phone"
            type="tel"
            name="phone"
            value={profileForm.phone}
            onChange={handleProfileChange}
            className={styles.formInput}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.btnPrimary} onClick={handleProfileSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );

  const renderAddressesSection = () => (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeading}>
        <div>
          <h2 className={styles.sectionTitle}>My Addresses</h2>
          <p className={styles.sectionSubtitle}>Manage your delivery addresses</p>
        </div>
        {!showAddressForm && (
          <button
            className={styles.btnOutline}
            onClick={() => {
              resetAddressForm();
              setShowAddressForm(true);
            }}
          >
            + Add New Address
          </button>
        )}
      </div>

      {showAddressForm && (
        <div className={styles.addressFormCard}>
          <h3 className={styles.addressFormTitle}>
            {editingAddressIndex !== null ? "Edit Address" : "Add New Address"}
          </h3>

          <div className={styles.labelSelector}>
            {["Home", "Work", "Other"].map((label) => (
              <button
                key={label}
                className={`${styles.labelChip} ${
                  addressForm.label === label ? styles.labelChipActive : ""
                }`}
                onClick={() => setAddressForm((prev) => ({ ...prev, label }))}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="af-first">First Name *</label>
              <input id="af-first" type="text" name="firstName" value={addressForm.firstName} onChange={handleAddressChange} className={styles.formInput} placeholder="Enter first name" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="af-last">Last Name *</label>
              <input id="af-last" type="text" name="lastName" value={addressForm.lastName} onChange={handleAddressChange} className={styles.formInput} placeholder="Enter last name" />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel} htmlFor="af-phone">Phone Number *</label>
              <input id="af-phone" type="tel" name="phone" value={addressForm.phone} onChange={handleAddressChange} className={styles.formInput} placeholder="10-digit mobile number" />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel} htmlFor="af-line1">Address Line 1 *</label>
              <input id="af-line1" type="text" name="addressLine1" value={addressForm.addressLine1} onChange={handleAddressChange} className={styles.formInput} placeholder="House/Flat No., Building, Street" />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel} htmlFor="af-line2">Address Line 2</label>
              <input id="af-line2" type="text" name="addressLine2" value={addressForm.addressLine2} onChange={handleAddressChange} className={styles.formInput} placeholder="Landmark, Area (optional)" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="af-city">City *</label>
              <input id="af-city" type="text" name="city" value={addressForm.city} onChange={handleAddressChange} className={styles.formInput} placeholder="Enter city" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="af-state">State *</label>
              <input id="af-state" type="text" name="state" value={addressForm.state} onChange={handleAddressChange} className={styles.formInput} placeholder="Enter state" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="af-postal">Postal Code *</label>
              <input id="af-postal" type="text" name="postalCode" value={addressForm.postalCode} onChange={handleAddressChange} className={styles.formInput} placeholder="Enter postal code" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="af-country">Country</label>
              <input id="af-country" type="text" name="country" value={addressForm.country} className={`${styles.formInput} ${styles.readOnly}`} readOnly />
              <span className={styles.fieldHint}>Currently shipping within India only</span>
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isDefault"
                checked={addressForm.isDefault}
                onChange={handleAddressChange}
                className={styles.checkbox}
              />
              <span>Set as default address</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <button className={styles.btnSecondary} onClick={resetAddressForm} disabled={loading}>
              Cancel
            </button>
            <button className={styles.btnPrimary} onClick={handleAddressSave} disabled={loading}>
              {loading
                ? "Saving..."
                : editingAddressIndex !== null
                ? "Update Address"
                : "Save Address"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.addressList}>
        {addresses.length === 0 && !showAddressForm ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Icon name="location" /></div>
            <p className={styles.emptyText}>No addresses saved yet</p>
            <p className={styles.emptySubtext}>Add an address to make checkout faster</p>
          </div>
        ) : (
          addresses.map((addr, index) => (
            <div
              key={addr.id || index}
              className={`${styles.addressCard} ${addr.isDefault ? styles.addressCardDefault : ""}`}
            >
              <div className={styles.addressCardHeader}>
                <div className={styles.addressLabelRow}>
                  <span className={styles.addressLabel}>{addr.label}</span>
                  {addr.isDefault && <span className={styles.defaultBadge}>Default</span>}
                </div>
                <div className={styles.addressActions}>
                  {!addr.isDefault && (
                    <button className={styles.actionLink} onClick={() => handleSetDefaultAddress(index)} disabled={loading}>
                      Set Default
                    </button>
                  )}
                  <button className={styles.actionLink} onClick={() => handleAddressEdit(index)} disabled={loading}>
                    Edit
                  </button>
                  <button className={`${styles.actionLink} ${styles.actionLinkDanger}`} onClick={() => handleAddressDelete(index)} disabled={loading}>
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.addressCardBody}>
                <p className={styles.addressName}>
                  {[addr.firstName, addr.lastName].filter(Boolean).join(" ") || addr.fullName || ""}
                </p>
                <p className={styles.addressText}>
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                </p>
                <p className={styles.addressText}>
                  {addr.city}, {addr.state} {addr.postalCode || addr.zipCode || ""}
                </p>
                <p className={styles.addressText}>{addr.country}</p>
                <p className={styles.addressPhone}>Phone: {addr.phone}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPaymentSection = () => (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>Payment Methods</h2>
        <p className={styles.sectionSubtitle}>Your saved cards and UPI</p>
      </div>
      {/* No payment-method API exists — render an honest empty state rather than
          fabricating saved cards. Payment is collected securely at checkout. */}
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><Icon name="card" /></div>
        <p className={styles.emptyText}>No saved payment methods yet</p>
        <p className={styles.emptySubtext}>
          For your security, payment details are entered fresh at checkout and aren't stored on your account.
        </p>
      </div>
    </div>
  );

  const renderWalletSection = () => (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>Store Credit</h2>
        <p className={styles.sectionSubtitle}>Your wallet balance and transaction history</p>
      </div>

      <div className={styles.walletBalanceCard}>
        <div className={styles.walletBalanceIcon}><Icon name="wallet" /></div>
        <div className={styles.walletBalanceText}>
          <span className={styles.walletBalanceLabel}>Available Balance</span>
          <span className={styles.walletBalanceValue}>{formatCurrency(walletBalance)}</span>
        </div>
        <p className={styles.walletBalanceHint}>Apply your store credit at checkout toward any order.</p>
      </div>

      <h3 className={styles.walletHistoryTitle}>Transaction History</h3>

      {walletLoading ? (
        <div className={styles.walletLoading}>
          <div className={styles.spinner} />
          <p>Loading your transactions…</p>
        </div>
      ) : walletTx.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Icon name="wallet" /></div>
          <p className={styles.emptyText}>No store-credit transactions yet</p>
          <p className={styles.emptySubtext}>
            Refunds issued to store credit, and credit you spend at checkout, will appear here.
          </p>
        </div>
      ) : (
        <div className={styles.walletTxList}>
          {walletTx.map((t) => {
            const isCredit = t.type === "credit";
            return (
              <div key={t.id} className={styles.walletTxRow}>
                <div
                  className={`${styles.walletTxBadge} ${
                    isCredit ? styles.walletTxBadgeCredit : styles.walletTxBadgeDebit
                  }`}
                  aria-hidden
                >
                  {isCredit ? "+" : "−"}
                </div>
                <div className={styles.walletTxBody}>
                  <span className={styles.walletTxReason}>
                    {t.reason || (isCredit ? "Store credit added" : "Store credit used")}
                  </span>
                  <span className={styles.walletTxMeta}>
                    {formatDate(t.createdAt, "medium")}
                    {t.orderNumber && (
                      <>
                        {" · "}
                        <button type="button" className={styles.walletTxLink} onClick={() => navigate("/orders")}>
                          {t.orderNumber}
                        </button>
                      </>
                    )}
                  </span>
                </div>
                <div className={styles.walletTxAmountWrap}>
                  <span className={isCredit ? styles.walletTxAmountCredit : styles.walletTxAmountDebit}>
                    {isCredit ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </span>
                  {t.balanceAfter != null && (
                    <span className={styles.walletTxBalance}>Bal: {formatCurrency(t.balanceAfter)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderNotificationsSection = () => (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        <p className={styles.sectionSubtitle}>Manage how we keep in touch</p>
      </div>
      {/* No notification-preference fields exist on the user yet — show an honest
          "coming soon" state rather than toggles that wouldn't persist. */}
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><Icon name="bell" /></div>
        <p className={styles.emptyText}>Notification preferences are coming soon</p>
        <p className={styles.emptySubtext}>
          For now, important order updates are always sent to <strong>{user.email}</strong>. You'll be able to fine-tune offers and reminders here shortly.
        </p>
      </div>
    </div>
  );

  const renderSettingsSection = () => (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>Settings</h2>
        <p className={styles.sectionSubtitle}>Security and appearance</p>
      </div>

      {/* Appearance */}
      <div className={styles.settingRow}>
        <div className={styles.settingRowText}>
          <span className={styles.settingRowLabel}>Appearance</span>
          <span className={styles.settingRowSub}>
            {isDarkMode ? "Dark mode is on" : "Light mode is on"}
          </span>
        </div>
        <button
          type="button"
          className={`${styles.themeToggle} ${isDarkMode ? styles.themeToggleOn : ""}`}
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDarkMode}
          aria-label="Toggle dark mode"
        >
          <span className={styles.themeToggleKnob} />
        </button>
      </div>

      {/* Change Password */}
      <h3 className={styles.subHeading}>
        <Icon name="lock" /> Change Password
      </h3>
      <div className={styles.passwordFormWrapper}>
        <div className={styles.formGroupStacked}>
          <label className={styles.formLabel} htmlFor="pw-current">Current Password *</label>
          <div className={styles.passwordInputWrapper}>
            <input
              id="pw-current"
              type={showPasswords.current ? "text" : "password"}
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className={styles.formInput}
              placeholder="Enter current password"
            />
            <button type="button" className={styles.passwordToggle} onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}>
              {showPasswords.current ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className={styles.formGroupStacked}>
          <label className={styles.formLabel} htmlFor="pw-new">New Password *</label>
          <div className={styles.passwordInputWrapper}>
            <input
              id="pw-new"
              type={showPasswords.new ? "text" : "password"}
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className={styles.formInput}
              placeholder="Enter new password"
            />
            <button type="button" className={styles.passwordToggle} onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}>
              {showPasswords.new ? "Hide" : "Show"}
            </button>
          </div>
          {passwordForm.newPassword && (
            <div className={`${styles.strengthMeter} ${styles[`strength_${passwordStrength.key}`]}`}>
              <div className={styles.strengthBar}>
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={`${styles.strengthSegment} ${
                      seg <= passwordStrength.level ? styles.strengthSegmentFilled : ""
                    }`}
                  />
                ))}
              </div>
              <span className={styles.strengthLabel}>{passwordStrength.label}</span>
            </div>
          )}
        </div>

        <div className={styles.formGroupStacked}>
          <label className={styles.formLabel} htmlFor="pw-confirm">Confirm New Password *</label>
          <div className={styles.passwordInputWrapper}>
            <input
              id="pw-confirm"
              type={showPasswords.confirm ? "text" : "password"}
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className={styles.formInput}
              placeholder="Confirm new password"
            />
            <button type="button" className={styles.passwordToggle} onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}>
              {showPasswords.confirm ? "Hide" : "Show"}
            </button>
          </div>
          {passwordForm.confirmPassword &&
            passwordForm.newPassword !== passwordForm.confirmPassword && (
              <span className={styles.fieldError}>Passwords do not match</span>
            )}
        </div>

        <div className={styles.passwordRequirements}>
          <p className={styles.requirementsTitle}>Password Requirements:</p>
          <ul className={styles.requirementsList}>
            <li className={passwordForm.newPassword.length >= 8 ? styles.requirementMet : ""}>At least 8 characters</li>
            <li className={/[A-Z]/.test(passwordForm.newPassword) ? styles.requirementMet : ""}>One uppercase letter</li>
            <li className={/[a-z]/.test(passwordForm.newPassword) ? styles.requirementMet : ""}>One lowercase letter</li>
            <li className={/[0-9]/.test(passwordForm.newPassword) ? styles.requirementMet : ""}>One number</li>
            <li className={/[^A-Za-z0-9]/.test(passwordForm.newPassword) ? styles.requirementMet : ""}>One special character</li>
          </ul>
        </div>

        <div className={styles.formActions}>
          <button className={styles.btnPrimary} onClick={handlePasswordSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );

  const SECTION_META = {
    profile: { title: "Edit Profile", render: renderProfileSection },
    addresses: { title: "Addresses", render: renderAddressesSection },
    payment: { title: "Payment Methods", render: renderPaymentSection },
    wallet: { title: "Store Credit", render: renderWalletSection },
    notifications: { title: "Notifications", render: renderNotificationsSection },
    settings: { title: "Settings", render: renderSettingsSection },
  };

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        {/* Feedback toast (fixed-position; see .feedback in the stylesheet) */}
        <AnimatePresence>
          {feedback.message && (
            <motion.div
              className={`${styles.feedback} ${styles[`feedback_${feedback.type}`]}`}
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <span>{feedback.message}</span>
              <button className={styles.feedbackClose} onClick={() => setFeedback({ type: "", message: "" })} aria-label="Dismiss">
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {activeSection ? (
          /* ===================== Section view ===================== */
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className={styles.sectionTopBar}>
              <button className={styles.backBtn} onClick={backToDashboard} aria-label="Back to account">
                <Icon name="back" />
                <span>Account</span>
              </button>
              <h1 className={styles.sectionPageTitle}>{SECTION_META[activeSection]?.title}</h1>
            </div>
            {SECTION_META[activeSection]?.render()}
          </motion.div>
        ) : (
          /* ===================== Dashboard view ===================== */
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header card */}
            <section className={styles.headerCard}>
              <div className={styles.headerAvatarWrap}>
                {user.avatar ? (
                  <img className={styles.headerAvatarImg} src={user.avatar} alt="" loading="lazy" />
                ) : (
                  <span className={styles.headerAvatarInitials}>
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                )}
              </div>
              <div className={styles.headerInfo}>
                <h1 className={styles.headerName}>
                  {user.firstName} {user.lastName}
                </h1>
                <p className={styles.headerEmail}>{user.email}</p>
                <span
                  className={`${styles.memberBadge} ${
                    membership.premium ? styles.memberBadgePremium : ""
                  }`}
                >
                  <Icon name="star" />
                  {membership.label}
                </span>
                {user.createdAt && (
                  <p className={styles.memberSince}>Member since {formatDate(user.createdAt, "medium")}</p>
                )}
              </div>
              <button
                className={styles.headerEditBtn}
                onClick={() => openSection("profile")}
                aria-label="Edit profile"
              >
                <Icon name="person" />
              </button>
            </section>

            {/* Stats row */}
            <section className={styles.statsRow} aria-label="Account summary">
              <button className={styles.statTile} onClick={() => navigate("/orders")} aria-label={`${statValue(orders.length)} orders`}>
                <span className={`${styles.statIcon} ${styles.toneTeal}`}><Icon name="orders" /></span>
                <span className={styles.statValue}>{statValue(orders.length)}</span>
                <span className={styles.statLabel}>Orders</span>
              </button>
              <button className={styles.statTile} onClick={() => navigate("/wishlist")} aria-label={`${wishlistItems.length} wishlist items`}>
                <span className={`${styles.statIcon} ${styles.tonePink}`}><Icon name="heart" /></span>
                <span className={styles.statValue}>{wishlistItems.length}</span>
                <span className={styles.statLabel}>Wishlist</span>
              </button>
              <div className={styles.statTile}>
                <span className={`${styles.statIcon} ${styles.toneGold}`}><Icon name="star" /></span>
                <span className={styles.statValue}>{statValue(reviewsCount ?? 0)}</span>
                <span className={styles.statLabel}>Reviews</span>
              </div>
            </section>

            {/* Menu list */}
            <nav className={styles.menuList} aria-label="Account menu">
              {menuRows.map((row) => (
                <button key={row.id} className={styles.menuRow} onClick={row.onClick} aria-label={row.label}>
                  <span className={`${styles.menuIcon} ${styles[`tone${row.tone[0].toUpperCase()}${row.tone.slice(1)}`]}`}>
                    <Icon name={row.icon} />
                  </span>
                  <span className={styles.menuRowText}>
                    <span className={styles.menuLabel}>
                      {row.label}
                      {row.badge != null && <span className={styles.menuBadge}>{row.badge}</span>}
                    </span>
                    <span className={styles.menuSub}>{row.sub}</span>
                  </span>
                  <span className={styles.menuChevron}><Icon name="chevron" /></span>
                </button>
              ))}
            </nav>

            {/* Recent Orders */}
            <section className={styles.recentSection}>
              <div className={styles.recentHeader}>
                <h2 className={styles.recentTitle}>Recent Orders</h2>
                {orders.length > 0 && (
                  <button className={styles.viewAllLink} onClick={() => navigate("/orders")}>
                    View All
                  </button>
                )}
              </div>

              {statsLoading ? (
                <div className={styles.recentList}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`${styles.recentRow} ${styles.recentRowSkeleton}`} aria-hidden>
                      <span className={styles.skeletonThumb} />
                      <span className={styles.skeletonLines} />
                    </div>
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className={styles.recentEmpty}>
                  <div className={styles.emptyIcon}><Icon name="orders" /></div>
                  <p className={styles.emptyText}>No orders yet</p>
                  <p className={styles.emptySubtext}>When you place an order, it'll show up here.</p>
                  <button className={styles.btnPrimary} onClick={() => navigate("/")}>Start Shopping</button>
                </div>
              ) : (
                <div className={styles.recentList}>
                  {recentOrders.map((order) => {
                    const statusInfo = getStatusInfo(order);
                    const firstItem = (order.items || [])[0] || {};
                    return (
                      <button
                        key={order.id || order.orderNumber}
                        className={styles.recentRow}
                        onClick={() => navigate("/orders")}
                        aria-label={`Order ${order.orderNumber || order.id}, ${statusInfo.label}`}
                      >
                        <span className={styles.recentThumb}>
                          <img
                            src={firstItem.image || "https://placehold.co/64x64?text=Item"}
                            alt={firstItem.name || "Product"}
                            loading="lazy"
                          />
                        </span>
                        <span className={styles.recentInfo}>
                          <span className={styles.recentOrderNo}>{order.orderNumber || `#${order.id}`}</span>
                          <span className={styles.recentMeta}>
                            {formatDate(order.createdAt, "medium")}
                          </span>
                          <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
                            {statusInfo.label}
                          </span>
                        </span>
                        <span className={styles.recentTotal}>{formatCurrency(order.total)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Logout */}
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <Icon name="logout" />
              Logout
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
