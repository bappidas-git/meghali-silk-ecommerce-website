/**
 * @jest-environment node
 */
// =============================================================================
// LIVE API CHECK — exercises the REAL src/services/api.js against the Laravel
// backend configured in .env (REACT_APP_API_URL). Nothing here is mocked.
//
// It WRITES to the real database: it registers a throwaway customer, places and
// then cancels/returns orders, and creates + deletes admin records (product,
// category, coupon, shipping method, review, banner, FAQ, leads). Every record it
// creates is tagged "LIVE-TEST" and removed again where the API allows it; the
// orders and the throwaway customer cannot be deleted through the API, so they
// are left cancelled / deactivated.
//
// Because of that it is OFF by default (`npm test` skips it). Run it on purpose:
//
//     npm run test:live
//
// Admin credentials come from LIVE_ADMIN_EMAIL / LIVE_ADMIN_PASSWORD and fall
// back to the seeded admin in backend-developer-guideline/postman-api-collection.json.
// =============================================================================

const live = process.env.LIVE_API === "1" ? describe : describe.skip;

// api.js reads sessionStorage/localStorage (auth tokens) lazily; give the Node
// test environment the same Storage surface the browser has.
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
  key(i) { return [...this.map.keys()][i] ?? null; }
  get length() { return this.map.size; }
}
global.sessionStorage = new MemoryStorage();
global.localStorage = new MemoryStorage();

const apiService = require("./api").default;
const { api, getErrorMessage } = require("./api");
const BASE_URL = require("./baseURL").default;
const { IS_MOCK_API } = require("./baseURL");
const authStorage = require("../utils/authStorage").default;

// axios 1.x proxies HTTPS by sending the request in plain HTTP to the proxy,
// which tunnelling proxies refuse (405). When a proxy is configured, leave the
// proxying to Node itself (NODE_USE_ENV_PROXY=1, set by the test:live script).
if (process.env.HTTPS_PROXY || process.env.https_proxy) api.defaults.proxy = false;

const ADMIN = {
  email: process.env.LIVE_ADMIN_EMAIL || "admin@store.com",
  password: process.env.LIVE_ADMIN_PASSWORD || "admin123",
};

const STAMP = Date.now().toString(36).toUpperCase();
const TAG = `LIVE-TEST-${STAMP}`;
const CUSTOMER = {
  firstName: "Live",
  lastName: `Test ${STAMP}`,
  email: `live-test-${STAMP.toLowerCase()}@example.com`,
  phone: "+919999900000",
  password: "LiveTest@2026",
};
const ADDRESS = {
  label: "Home",
  firstName: "Live",
  lastName: "Test",
  phone: "+91 9999900000",
  addressLine1: `${TAG} — automated check, ignore`,
  addressLine2: "",
  city: "Guwahati",
  state: "Assam",
  postalCode: "781001",
  country: "India",
  isDefault: true,
};

// Shared state threaded through the sequential tests below.
const S = {};

const status = (err) => err?.response?.status;
const expectRejected = async (promise, statuses) => {
  let caught = null;
  try { await promise; } catch (e) { caught = e; }
  expect(caught).not.toBeNull();
  if (statuses) expect(statuses).toContain(status(caught));
  return caught;
};

// Mirror what AuthContext does after apiService.auth.login resolves — the
// coupon validator and cart/wishlist sync read the stored user.
const rememberCustomer = (user) => authStorage.set("user", JSON.stringify(user), false);

// Build the exact payload Checkout.js sends (money is recomputed server-side,
// the client figures are what the UI shows before submit).
const buildOrder = ({ product, quantity = 1, couponCode = null, discountAmount = 0, taxRate = 0, shippingAmount = 0 }) => {
  const variant = (product.variants || [])[0] || null;
  const price = Number(variant?.price ?? product.price);
  const subtotal = price * quantity;
  const taxAmount = Math.round(((subtotal - discountAmount) * taxRate) / 100);
  const total = subtotal - discountAmount + shippingAmount + taxAmount;
  return {
    items: [{
      productId: product.id,
      variantId: variant?.id ?? null,
      name: `${product.name}${variant ? ` - ${variant.name}` : ""}`,
      image: product.images?.[0] || "",
      sku: variant?.sku || product.sku || "",
      price,
      quantity,
      subtotal,
    }],
    shippingAddress: ADDRESS,
    billingAddress: ADDRESS,
    subtotal,
    discountAmount,
    couponCode,
    shippingAmount,
    taxAmount,
    codFee: 0,
    total,
    storeCreditUsed: 0,
    amountPayable: total,
    paymentMethod: "cod",
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    shippingStatus: "pending",
    trackingNumber: null,
    notes: TAG,
    // OrderContext adds these before apiService.orders.create is called.
    userId: S.customer?.id ?? null,
    orderNumber: `ORD-${STAMP}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

jest.setTimeout(90000);

live("Live API — " + BASE_URL, () => {
  let errorSpy;
  beforeAll(() => {
    // api.js logs every rejected request; expected rejections (401/404/422
    // probes) would otherwise flood the output.
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(() => errorSpy.mockRestore());

  // ───────────────────────────── configuration ─────────────────────────────
  test("service is pointed at the production API, not the mock server", () => {
    expect(IS_MOCK_API).toBe(false);
    expect(BASE_URL).toBe("https://core.meghalisilk.in/api/v1");
    expect(api.defaults.baseURL).toBe(BASE_URL);
  });

  // ───────────────────────────── public reads ──────────────────────────────
  test("products.getAll returns only visible products with the fields the storefront reads", async () => {
    const list = await apiService.products.getAll();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) {
      expect(p.isActive).not.toBe(false);
      expect(typeof p.id).toBe("number");
      expect(typeof p.name).toBe("string");
      expect(typeof p.slug).toBe("string");
      expect(typeof p.price).toBe("number");
      expect(Array.isArray(p.images)).toBe(true);
      expect(Array.isArray(p.variants)).toBe(true);
    }
    // Cheapest product is what the order flows below buy.
    S.product = [...list].sort((a, b) => a.price - b.price)[0];
    S.stockBefore = S.product.stock;
  });

  test("products.getById / getBySlug / featured / trending / category / search / reviews / related", async () => {
    const byId = await apiService.products.getById(S.product.id);
    expect(byId.id).toBe(S.product.id);
    const bySlug = await apiService.products.getBySlug(S.product.slug);
    expect(bySlug.id).toBe(S.product.id);

    const featured = await apiService.products.getFeatured(4);
    expect(Array.isArray(featured)).toBe(true);
    expect(featured.length).toBeLessThanOrEqual(4);
    const trending = await apiService.products.getTrending(4);
    expect(Array.isArray(trending)).toBe(true);
    expect(trending.length).toBeLessThanOrEqual(4);

    const inCategory = await apiService.products.getByCategory(S.product.categoryId);
    expect(inCategory.some((p) => p.id === S.product.id)).toBe(true);

    const found = await apiService.products.search(S.product.name.split(" ")[0]);
    expect(found.some((p) => p.id === S.product.id)).toBe(true);

    const reviews = await apiService.products.getReviews(S.product.id);
    expect(Array.isArray(reviews)).toBe(true);
    for (const r of reviews) expect(r.status ?? "approved").toBe("approved");

    const related = await apiService.products.getRelated(S.product, 4);
    expect(Array.isArray(related)).toBe(true);
    expect(related.some((p) => p.id === S.product.id)).toBe(false);
  });

  test("products.getById rejects an unknown id with 404", async () => {
    await expectRejected(apiService.products.getById(987654321), [404]);
  });

  test("categories.getAll / getById / getBySlug", async () => {
    const cats = await apiService.categories.getAll();
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) expect(c.isActive).not.toBe(false);
    S.category = cats.find((c) => c.id === S.product.categoryId) || cats[0];
    const byId = await apiService.categories.getById(S.category.id);
    expect(byId.slug).toBe(S.category.slug);
    const bySlug = await apiService.categories.getBySlug(S.category.slug);
    expect(bySlug.id).toBe(S.category.id);
    await expectRejected(apiService.categories.getBySlug(`no-such-${STAMP}`), [404]);
  });

  test("banners / hero config / settings / shipping methods / faqs / deals config / coupons", async () => {
    const banners = await apiService.banners.getAll();
    expect(Array.isArray(banners)).toBe(true);
    S.banners = banners;

    const hero = await apiService.hero.getConfig();
    expect(typeof hero.enabled).toBe("boolean");
    expect(hero.heights).toBeDefined();

    const settings = await apiService.settings.get();
    expect(settings.store?.currency).toBeDefined();
    expect(typeof settings.store?.taxRate).toBe("number");
    expect(typeof settings.payment?.codEnabled).toBe("boolean");
    expect(settings.social).toBeDefined();
    S.settings = settings;

    const methods = await apiService.shipping.getMethods();
    expect(methods.length).toBeGreaterThan(0);
    for (const m of methods) expect(m.isActive).not.toBe(false);
    S.shippingMethod = methods[0];

    const faqs = await apiService.faqs.getAll();
    expect(Array.isArray(faqs)).toBe(true);
    S.faqs = faqs;

    const deals = await apiService.deals.getConfig();
    expect(typeof deals.enabled).toBe("boolean");

    const coupons = await apiService.coupons.getActive();
    expect(Array.isArray(coupons)).toBe(true);
    for (const c of coupons) expect(c.isActive).not.toBe(false);
    S.coupons = coupons;
  });

  test("protected customer endpoints reject a guest with 401", async () => {
    await expectRejected(apiService.cart.getCart(), [401]);
    await expectRejected(apiService.wishlist.get(), [401]);
    await expectRejected(apiService.orders.getByUserId(), [401]);
    await expectRejected(apiService.auth.getUser(), [401]);
  });

  // ───────────────────────────── customer auth ─────────────────────────────
  test("auth.register creates an account and rejects a duplicate email with 422", async () => {
    const created = await apiService.auth.register({ ...CUSTOMER, confirmPassword: CUSTOMER.password });
    expect(created).toBeTruthy();
    expect(created.password).toBeUndefined();
    const dup = await expectRejected(
      apiService.auth.register({ ...CUSTOMER, confirmPassword: CUSTOMER.password }),
      [422]
    );
    expect(getErrorMessage(dup)).toMatch(/email/i);
  });

  test("auth.login rejects a wrong password (401) and does not touch storage", async () => {
    await expectRejected(apiService.auth.login({ email: CUSTOMER.email, password: "wrong-password" }), [401]);
    expect(authStorage.get("token")).toBeNull();
  });

  test("auth.login stores the bearer token and returns the safe user", async () => {
    const user = await apiService.auth.login({ email: CUSTOMER.email, password: CUSTOMER.password, remember: false });
    expect(user).toBeTruthy();
    expect(user.email).toBe(CUSTOMER.email);
    expect(user.password).toBeUndefined();
    expect(sessionStorage.getItem("token")).toBeTruthy();
    expect(localStorage.getItem("token")).toBeNull();
    rememberCustomer(user);
    S.customer = user;
  });

  test("auth.getUser / updateUser / address book round-trip", async () => {
    const me = await apiService.auth.getUser();
    expect(me.id).toBe(S.customer.id);
    const updated = await apiService.auth.updateUser({ phone: "+919999900001" });
    expect(updated.phone).toBe("+919999900001");
    const withAddress = await apiService.auth.updateUser({ addresses: [{ id: `addr-${STAMP}`, ...ADDRESS }] });
    expect(withAddress.addresses).toHaveLength(1);
    expect(withAddress.addresses[0].city).toBe("Guwahati");
  });

  test("auth.changePassword then login with the new password", async () => {
    const newPassword = "LiveTest@2027";
    await apiService.auth.changePassword({ currentPassword: CUSTOMER.password, newPassword, confirmPassword: newPassword });
    await expectRejected(
      apiService.auth.changePassword({ currentPassword: "not-the-password", newPassword, confirmPassword: newPassword }),
      [401, 422]
    );
    CUSTOMER.password = newPassword;
    const user = await apiService.auth.login({ email: CUSTOMER.email, password: newPassword });
    expect(user.id).toBe(S.customer.id);
    rememberCustomer(user);
  });

  // ───────────────────────────── cart & wishlist ───────────────────────────
  test("cart: add / get / update / remove / clear", async () => {
    const p = S.product;
    const v = p.variants[0];
    const row = await apiService.cart.addToCart({
      productId: p.id, variantId: v?.id ?? null, variantName: v?.name ?? null,
      name: p.name, image: p.images[0], price: v?.price ?? p.price, comparePrice: p.comparePrice,
      currency: "INR", quantity: 1, stock: p.stock, userId: S.customer.id,
    });
    expect(row.id).toBeDefined();
    let cart = await apiService.cart.getCart(S.customer.id);
    expect(cart.some((r) => String(r.id) === String(row.id))).toBe(true);
    const bumped = await apiService.cart.updateCartItem(row.id, { quantity: 2 });
    expect(Number(bumped.quantity)).toBe(2);
    await apiService.cart.removeFromCart(row.id);
    cart = await apiService.cart.getCart(S.customer.id);
    expect(cart.some((r) => String(r.id) === String(row.id))).toBe(false);
    await apiService.cart.addToCart({ productId: p.id, variantId: null, name: p.name, image: p.images[0], price: p.price, comparePrice: p.comparePrice, currency: "INR", quantity: 1, userId: S.customer.id });
    await apiService.cart.clearCart();
    cart = await apiService.cart.getCart(S.customer.id);
    expect(cart).toHaveLength(0);
  });

  test("wishlist: add / get (nested product is normalisable) / remove", async () => {
    const p = S.product;
    const row = await apiService.wishlist.add({
      productId: p.id, slug: p.slug, name: p.name, image: p.images[0], brand: p.brand, category: null,
      price: p.price, comparePrice: p.comparePrice, rating: p.rating, totalReviews: p.totalReviews,
      shortDescription: p.shortDescription, variants: p.variants, stock: p.stock, trending: p.trending,
      hot: p.hot, addedAt: new Date().toISOString(), userId: S.customer.id,
    });
    expect(row.id).toBeDefined();
    const rows = await apiService.wishlist.get(S.customer.id);
    const mine = rows.find((r) => String(r.id) === String(row.id));
    expect(mine).toBeDefined();
    // WishlistContext accepts a flat row or one with the product nested.
    const productId = mine.productId ?? mine.product?.id;
    expect(productId).toBe(p.id);
    expect(mine.name ?? mine.product?.name).toBe(p.name);
    await apiService.wishlist.remove(row.id);
    const after = await apiService.wishlist.get(S.customer.id);
    expect(after.some((r) => String(r.id) === String(row.id))).toBe(false);
  });

  // ───────────────────────────── coupons ───────────────────────────────────
  test("coupons.validate accepts a live code, rejects unknown / below-minimum codes", async () => {
    const coupon = S.coupons.find((c) => !c.perUserLimit && (!c.expiresAt || new Date(c.expiresAt) > new Date()) && c.minOrderAmount < S.product.price);
    expect(coupon).toBeDefined();
    S.coupon = coupon;
    const ok = await apiService.coupons.validate(coupon.code, S.product.price);
    expect(ok.code).toBe(coupon.code);
    const unknown = await expectRejected(apiService.coupons.validate(`NOPE${STAMP}`, 10000), [404, 422]);
    expect(getErrorMessage(unknown)).toBeTruthy();
    if (coupon.minOrderAmount > 0) {
      await expectRejected(apiService.coupons.validate(coupon.code, coupon.minOrderAmount - 1), [422]);
    }
  });

  // ───────────────────────────── order A: full delivery + review + return ──
  test("orders.create (COD) and reads: getByUserId / getById / getByOrderNumber", async () => {
    const payload = buildOrder({ product: S.product, taxRate: S.settings.store.taxRate, shippingAmount: 0 });
    const order = await apiService.orders.create(payload);
    expect(order.id).toBeDefined();
    expect(order.orderNumber).toBeTruthy();
    expect(Number(order.total)).toBeGreaterThan(0);
    expect(order.paymentMethod).toBe("cod");
    expect(order.paymentStatus).toBe("pending");
    expect(order.fulfillmentStatus).toBe("unfulfilled");
    expect(Array.isArray(order.statusHistory)).toBe(true);
    S.orderA = order;

    const mine = await apiService.orders.getByUserId(S.customer.id);
    expect(mine.some((o) => o.id === order.id)).toBe(true);
    const byId = await apiService.orders.getById(order.id);
    expect(byId.orderNumber).toBe(order.orderNumber);
    const byNumber = await apiService.orders.getByOrderNumber(order.orderNumber);
    expect(byNumber.id).toBe(order.id);
  });

  test("stock is decremented when the order is placed", async () => {
    const p = await apiService.products.getById(S.product.id);
    expect(p.stock).toBe(S.stockBefore - 1);
  });

  // ───────────────────────────── admin auth ────────────────────────────────
  test("admin.login rejects a wrong password and stores the admin token on success", async () => {
    await expectRejected(apiService.admin.login({ email: ADMIN.email, password: "wrong-password" }), [401]);
    const admin = await apiService.admin.login(ADMIN);
    expect(admin).toBeTruthy();
    expect(admin.email).toBe(ADMIN.email);
    expect(sessionStorage.getItem("adminToken")).toBeTruthy();
    sessionStorage.setItem("admin", JSON.stringify(admin));
    S.admin = admin;
  });

  test("admin.getDashboardStats returns the figures the dashboard cards read", async () => {
    const stats = await apiService.admin.getDashboardStats();
    for (const k of ["totalProducts", "totalOrders", "totalRevenue", "totalUsers", "pendingOrders", "pendingReturns", "lowStockProducts", "activeCoupons"]) {
      expect(typeof stats[k]).toBe("number");
    }
  });

  test("admin.getOrders lists the new order with the customer joined; getOrder reads it", async () => {
    const all = await apiService.admin.getOrders();
    const row = all.find((o) => o.id === S.orderA.id);
    expect(row).toBeDefined();
    expect(row.customerEmail).toBe(CUSTOMER.email);
    expect(row.customerName).toContain("Live");
    const byUser = await apiService.admin.getOrders({ userId: S.customer.id });
    expect(byUser.every((o) => o.userId === S.customer.id)).toBe(true);
    const one = await apiService.admin.getOrder(S.orderA.id);
    expect(one.orderNumber).toBe(S.orderA.orderNumber);
  });

  test("admin.updateOrder: fulfil + tracking (with timeline event), deliver, mark paid", async () => {
    const shipped = await apiService.admin.updateOrder(
      S.orderA.id,
      { fulfillmentStatus: "fulfilled", shippingStatus: "shipped", trackingNumber: `TRK${STAMP}`, trackingUrl: "https://example.com/track" },
      { action: "Fulfilled & shipped", note: `Tracking TRK${STAMP}` }
    );
    expect(shipped.fulfillmentStatus).toBe("fulfilled");
    expect(shipped.shippingStatus).toBe("shipped");
    expect(shipped.trackingNumber).toBe(`TRK${STAMP}`);
    expect(shipped.statusHistory.some((e) => e.action === "Fulfilled & shipped")).toBe(true);

    const delivered = await apiService.admin.updateOrder(S.orderA.id, { shippingStatus: "delivered", deliveredAt: new Date().toISOString() }, { action: "Marked delivered" });
    expect(delivered.shippingStatus).toBe("delivered");

    const paid = await apiService.admin.updateOrder(S.orderA.id, { paymentStatus: "paid" }, { action: "Payment marked as paid" });
    expect(paid.paymentStatus).toBe("paid");
  });

  test("admin.getPayments(orderId) shows the captured COD payment; getPayment reads it", async () => {
    const rows = await apiService.admin.getPayments({ orderId: S.orderA.id });
    expect(rows.length).toBeGreaterThan(0);
    const pay = rows[0];
    expect(Number(pay.amount)).toBe(Number(S.orderA.total));
    expect(pay.status).toBe("captured");
    S.paymentA = await apiService.admin.getPayment(pay.id);
    expect(S.paymentA.orderId).toBe(S.orderA.id);
  });

  test("customer review: submit (purchase-gated) → pending in reviews.getMine → admin approves → public", async () => {
    const review = await apiService.reviews.submit({
      productId: S.product.id, userId: S.customer.id, userName: "Live Test",
      rating: 5, title: TAG, body: "Automated live check — will be removed.", orderId: S.orderA.id,
    });
    expect(review.id).toBeDefined();
    expect(review.status).toBe("pending");
    S.reviewId = review.id;

    const mine = await apiService.reviews.getMine(S.customer.id);
    expect(mine.some((r) => r.id === review.id && r.status === "pending")).toBe(true);

    let pub = await apiService.products.getReviews(S.product.id);
    expect(pub.some((r) => r.id === review.id)).toBe(false);

    const approved = await apiService.admin.updateReview(review.id, { status: "approved" });
    expect(approved.status).toBe("approved");
    pub = await apiService.products.getReviews(S.product.id);
    expect(pub.some((r) => r.id === review.id)).toBe(true);

    const adminList = await apiService.admin.getReviews();
    expect(adminList.some((r) => r.id === review.id)).toBe(true);
  });

  test("admin return lifecycle: create → approve → pickup → in transit → received → refund to store credit (restock)", async () => {
    const item = S.orderA.items[0];
    // Same figure Admin → Returns computes: the returned items' value net of
    // their share of the order discount (tax and shipping are not refunded).
    const gross = Number(item.price) * Number(item.quantity);
    const discountShare = Number(S.orderA.discountAmount) > 0
      ? Math.min(gross, Math.round((gross / Number(S.orderA.subtotal)) * Number(S.orderA.discountAmount)))
      : 0;
    S.returnRefund = gross - discountShare;
    const ret = await apiService.admin.createReturn({
      orderId: S.orderA.id, orderNumber: S.orderA.orderNumber, userId: S.customer.id,
      items: [{ productId: item.productId, variantId: item.variantId, name: item.name, sku: item.sku, price: item.price, quantity: item.quantity, subtotal: item.subtotal }],
      reason: "defective", reasonDetails: TAG, refundAmount: S.returnRefund, refundMethod: "store_credit",
    });
    expect(ret.id).toBeDefined();
    expect(ret.returnNumber).toMatch(/^RET-/);
    expect(ret.status).toBe("requested");
    expect(Number(ret.refundAmount)).toBe(S.returnRefund);
    S.returnA = ret;

    const list = await apiService.admin.getReturns();
    expect(list.some((r) => r.id === ret.id)).toBe(true);
    const one = await apiService.admin.getReturn(ret.id);
    expect(one.orderId).toBe(S.orderA.id);

    const approved = await apiService.admin.updateReturn(ret.id, { status: "approved", notes: TAG }, { event: { action: "Return approved" } });
    expect(approved.status).toBe("approved");
    const pickup = await apiService.admin.scheduleReturnPickup(ret.id, { trackingNumber: `RTN${STAMP}`, trackingUrl: "https://example.com/rtn", carrier: "Test" });
    expect(pickup.status).toBe("pickup_scheduled");
    expect(pickup.returnTrackingNumber).toBe(`RTN${STAMP}`);
    const transit = await apiService.admin.markReturnInTransit(ret.id, `RTN${STAMP}`);
    expect(transit.status).toBe("in_transit");
    const received = await apiService.admin.updateReturn(ret.id, { status: "received" }, { event: { action: "Items received" } });
    expect(received.status).toBe("received");

    S.walletBefore = await apiService.wallet.getBalance(S.customer.id);
    const refunded = await apiService.admin.updateReturn(
      ret.id,
      { status: "refunded", refundStatus: "processed", deductionAmount: 100, refundMethod: "store_credit", notes: TAG },
      { event: { action: "Refund processed" }, restock: true }
    );
    expect(refunded.status).toBe("refunded");
    expect(refunded.refundStatus).toBe("processed");
    expect(refunded.restocked).toBe(true);
    S.returnA = refunded;
  });

  test("return refund cascades: wallet credited, ledger row, payment + order reflect it, stock restored", async () => {
    const expected = S.returnRefund - 100;
    const balance = await apiService.wallet.getBalance(S.customer.id);
    expect(balance - S.walletBefore).toBe(expected);
    const tx = await apiService.wallet.getTransactions(S.customer.id);
    expect(tx.length).toBeGreaterThan(0);
    expect(tx[0].type).toBe("credit");
    expect(Number(tx[0].amount)).toBe(expected);

    const refunds = await apiService.admin.getRefunds({ orderId: S.orderA.id });
    const rec = refunds.find((r) => r.returnId === S.returnA.id || r.type === "return_refund");
    expect(rec).toBeDefined();
    expect(rec.status).toBe("completed");
    expect(rec.method).toBe("store_credit");

    const pay = await apiService.admin.getPayment(S.paymentA.id);
    expect(["refunded", "partially_refunded"]).toContain(pay.status);
    expect(Number(pay.refundAmount)).toBe(expected);

    const order = await apiService.admin.getOrder(S.orderA.id);
    expect(order.fulfillmentStatus).toBe("returned");
    expect(["refunded", "partially_refunded"]).toContain(order.paymentStatus);

    const product = await apiService.products.getById(S.product.id);
    expect(product.stock).toBe(S.stockBefore);
  });

  test("admin.issueRefund rejects an amount beyond what the payment still holds (422)", async () => {
    await expectRejected(apiService.admin.issueRefund(S.paymentA.id, 10 ** 9, TAG), [422]);
  });

  // ───────────────────────────── order B: refund lifecycle + admin cancel ──
  test("order B with a coupon: coupon redemption is counted server-side", async () => {
    const payload = buildOrder({
      product: S.product, taxRate: S.settings.store.taxRate, couponCode: S.coupon.code,
      discountAmount: S.coupon.type === "percentage" ? Math.round((S.product.price * S.coupon.value) / 100) : S.coupon.value,
    });
    S.couponUsedBefore = (await apiService.admin.getCoupons()).find((c) => c.id === S.coupon.id).usedCount;
    const order = await apiService.orders.create(payload);
    expect(order.couponCode).toBe(S.coupon.code);
    expect(Number(order.discountAmount)).toBeGreaterThan(0);
    S.orderB = order;
    const after = (await apiService.admin.getCoupons()).find((c) => c.id === S.coupon.id).usedCount;
    expect(after).toBe(S.couponUsedBefore + 1);
  });

  test("order refund lifecycle: mark paid → initiate → fail → initiate → complete", async () => {
    await apiService.admin.updateOrder(S.orderB.id, { paymentStatus: "paid" }, { action: "Payment marked as paid" });
    const initiated = await apiService.admin.initiateOrderRefund(S.orderB.id, { amount: 50, method: "original_payment", reason: TAG });
    expect(initiated.refundStatus).toBe("processing");
    expect(Number(initiated.pendingRefund?.amount)).toBe(50);
    let pay = (await apiService.admin.getPayments({ orderId: S.orderB.id }))[0];
    expect(pay.status).toBe("refund_pending");

    const failed = await apiService.admin.failOrderRefund(S.orderB.id, "bounced");
    expect(failed.refundStatus).toBe("failed");
    pay = (await apiService.admin.getPayments({ orderId: S.orderB.id }))[0];
    expect(pay.status).toBe("captured");

    await apiService.admin.initiateOrderRefund(S.orderB.id, { amount: 50, method: "original_payment", reason: TAG });
    const completed = await apiService.admin.completeOrderRefund(S.orderB.id);
    expect(completed.refundStatus).toBe("completed");
    expect(Number(completed.refundedAmount)).toBe(50);
    expect(completed.paymentStatus).toBe("partially_refunded");
    pay = (await apiService.admin.getPayments({ orderId: S.orderB.id }))[0];
    expect(pay.status).toBe("partially_refunded");
    expect(Number(pay.refundAmount)).toBe(50);
  });

  test("admin.cancelOrder with refund + restock: order cancelled, refund pending, coupon restored", async () => {
    const cancelled = await apiService.admin.cancelOrder(S.orderB.id, { reason: TAG, restock: true, refund: { method: "original_payment" } });
    expect(cancelled.fulfillmentStatus).toBe("cancelled");
    expect(cancelled.refundStatus).toBe("processing");
    expect(cancelled.statusHistory.some((e) => e.action === "Order cancelled")).toBe(true);
    const after = (await apiService.admin.getCoupons()).find((c) => c.id === S.coupon.id).usedCount;
    expect(after).toBe(S.couponUsedBefore);
    const settled = await apiService.admin.completeOrderRefund(S.orderB.id);
    expect(settled.refundStatus).toBe("completed");
    expect(settled.paymentStatus).toBe("refunded");
    const product = await apiService.products.getById(S.product.id);
    expect(product.stock).toBe(S.stockBefore);
  });

  // ───────────────────────────── order C: customer cancel ──────────────────
  test("orders.cancel (customer): COD order cancelled, payment voided, stock restored", async () => {
    const order = await apiService.orders.create(buildOrder({ product: S.product, taxRate: S.settings.store.taxRate }));
    S.orderC = order;
    const cancelled = await apiService.orders.cancel(order.id, "Cancelled by customer");
    expect(cancelled.fulfillmentStatus).toBe("cancelled");
    expect(cancelled.paymentStatus).toBe("voided");
    const pay = (await apiService.admin.getPayments({ orderId: order.id }))[0];
    expect(pay.status).toBe("voided");
    const product = await apiService.products.getById(S.product.id);
    expect(product.stock).toBe(S.stockBefore);
    // A cancelled order cannot be cancelled twice.
    await expectRejected(apiService.orders.cancel(order.id), [409, 422]);
  });

  // ───────────────────────────── customer returns (defined, unused by UI) ──
  test("returns.getByUserId lists the return the admin processed (customer endpoints)", async () => {
    const mine = await apiService.returns.getByUserId(S.customer.id);
    expect(mine.some((r) => r.id === S.returnA.id)).toBe(true);
    const one = await apiService.returns.getById(S.returnA.id);
    expect(one.status).toBe("refunded");
  });

  // ───────────────────────────── leads ─────────────────────────────────────
  test("leads: contact + newsletter → admin list / get / update / delete", async () => {
    const contact = await apiService.leads.createContact({
      name: "Live Test", email: CUSTOMER.email, phone: "+919999900000", orderNumber: S.orderA.orderNumber,
      category: "shipping", subject: TAG, message: "Automated live check — will be removed.",
    });
    expect(contact.id).toBeDefined();
    expect(contact.type).toBe("contact");
    expect(contact.status).toBe("new");
    const news = await apiService.leads.createNewsletter(`news-${STAMP.toLowerCase()}@example.com`);
    expect(news.id).toBeDefined();
    expect(news.type).toBe("newsletter");
    expect(news.status).toBe("subscribed");

    const all = await apiService.admin.getLeads();
    expect(all.some((l) => l.id === contact.id)).toBe(true);
    expect(all.some((l) => l.id === news.id)).toBe(true);
    const one = await apiService.admin.getLead(contact.id);
    expect(one.subject).toBe(TAG);
    const updated = await apiService.admin.updateLead(contact.id, { status: "contacted", notes: "handled" });
    expect(updated.status).toBe("contacted");
    await apiService.admin.deleteLead(contact.id);
    await apiService.admin.deleteLead(news.id);
    await expectRejected(apiService.admin.getLead(contact.id), [404]);
  });

  // ───────────────────────────── admin catalogue CRUD ──────────────────────
  test("admin products: create draft → hidden from storefront → publish → visible → update → delete", async () => {
    const base = S.product;
    const created = await apiService.admin.createProduct({
      name: `${TAG} product`, slug: `live-test-${STAMP.toLowerCase()}`, sku: `LT-${STAMP}`,
      shortDescription: "automated", description: "automated live check — will be removed",
      categoryId: base.categoryId, brand: base.brand, images: base.images, price: 1234, comparePrice: 1500,
      costPrice: 900, stock: 3, lowStockThreshold: 1, weight: 0.5, dimensions: { length: 10, width: 10, height: 2 },
      variants: [], tags: ["live-test"], featured: false, trending: false, hot: false, isActive: false,
      metaTitle: TAG, metaDescription: TAG, relatedProductIds: [], frequentlyBoughtTogetherIds: [],
    });
    expect(created.id).toBeDefined();
    expect(created.isActive).toBe(false);
    S.newProductId = created.id;

    // Draft: the public read either hides it (404) or the client gate nulls it.
    let visible;
    try { visible = await apiService.products.getById(created.id); } catch (e) { expect(status(e)).toBe(404); visible = null; }
    expect(visible).toBeNull();
    expect((await apiService.products.getAll()).some((p) => p.id === created.id)).toBe(false);
    expect((await apiService.admin.getProducts()).some((p) => p.id === created.id)).toBe(true);
    const adminRead = await apiService.admin.getProduct(created.id);
    expect(adminRead.sku).toBe(`LT-${STAMP}`);

    const published = await apiService.admin.updateProduct(created.id, { ...adminRead, isActive: true, price: 1299 });
    expect(published.isActive).toBe(true);
    expect(Number(published.price)).toBe(1299);
    expect((await apiService.products.getById(created.id)).id).toBe(created.id);

    await apiService.admin.deleteProduct(created.id);
    await expectRejected(apiService.admin.getProduct(created.id), [404]);
  });

  test("admin categories: create → update → delete; deleting a category in use is refused (409)", async () => {
    const created = await apiService.admin.createCategory({
      name: `${TAG} category`, slug: `live-test-cat-${STAMP.toLowerCase()}`, description: "automated",
      image: "", parentId: null, isActive: false, sortOrder: 99, showInMainMenu: false, menuOrder: 99,
    });
    expect(created.id).toBeDefined();
    expect((await apiService.categories.getAll()).some((c) => c.id === created.id)).toBe(false);
    expect((await apiService.admin.getCategories()).some((c) => c.id === created.id)).toBe(true);
    const updated = await apiService.admin.updateCategory(created.id, { ...created, isActive: true, description: "updated" });
    expect(updated.isActive).toBe(true);
    expect((await apiService.categories.getAll()).some((c) => c.id === created.id)).toBe(true);
    await apiService.admin.deleteCategory(created.id);
    await expectRejected(apiService.categories.getById(created.id), [404]);

    const inUse = await expectRejected(apiService.admin.deleteCategory(S.product.categoryId), [409]);
    expect(getErrorMessage(inUse)).toBeTruthy();
  });

  test("admin coupons: create → customer can validate → update → duplicate code 422 → delete", async () => {
    const code = `LT${STAMP}`;
    const created = await apiService.admin.createCoupon({
      code, description: TAG, type: "fixed", value: 10, minOrderAmount: 100, maxDiscount: 10,
      usageLimit: 5, perUserLimit: null, isActive: true, expiresAt: "2030-01-01T00:00:00.000Z",
    });
    expect(created.id).toBeDefined();
    expect(created.usedCount).toBe(0);
    const valid = await apiService.coupons.validate(code, 500);
    expect(valid.code).toBe(code);
    const updated = await apiService.admin.updateCoupon(created.id, { ...created, value: 20 });
    expect(Number(updated.value)).toBe(20);
    expect(updated.usedCount).toBe(0);
    await expectRejected(apiService.admin.createCoupon({ ...created, id: undefined, code }), [422]);
    await apiService.admin.deleteCoupon(created.id);
    await expectRejected(apiService.coupons.validate(code, 500), [404, 422]);
  });

  test("admin shipping methods: create inactive → hidden from storefront → activate → visible → delete", async () => {
    const created = await apiService.admin.createShippingMethod({
      name: `${TAG} shipping`, carrier: "Test", description: "automated", rateType: "flat", flatRate: 10,
      freeAbove: null, estimatedDays: "1", isActive: false,
    });
    expect(created.id).toBeDefined();
    expect((await apiService.shipping.getMethods()).some((m) => m.id === created.id)).toBe(false);
    expect((await apiService.admin.getShippingMethods()).some((m) => m.id === created.id)).toBe(true);
    const on = await apiService.admin.updateShippingMethod(created.id, { ...created, isActive: true, flatRate: 15 });
    expect(on.isActive).toBe(true);
    expect((await apiService.shipping.getMethods()).some((m) => m.id === created.id)).toBe(true);
    await apiService.admin.deleteShippingMethod(created.id);
    expect((await apiService.admin.getShippingMethods()).some((m) => m.id === created.id)).toBe(false);
  });

  test("admin reviews: create (approved, source admin) → public → reject → hidden → delete both test reviews", async () => {
    const created = await apiService.admin.createReview({
      productId: S.product.id, userName: "Live Test", rating: 4, title: `${TAG} admin`, body: "automated", isVerifiedPurchase: false, status: "approved",
    });
    expect(created.id).toBeDefined();
    expect(created.status).toBe("approved");
    expect(created.userId).toBeNull();
    expect((await apiService.products.getReviews(S.product.id)).some((r) => r.id === created.id)).toBe(true);
    const rejected = await apiService.admin.updateReview(created.id, { status: "rejected" });
    expect(rejected.status).toBe("rejected");
    expect((await apiService.products.getReviews(S.product.id)).some((r) => r.id === created.id)).toBe(false);
    await apiService.admin.deleteReview(created.id);
    await apiService.admin.deleteReview(S.reviewId);
    expect((await apiService.admin.getReviews()).some((r) => r.id === created.id || r.id === S.reviewId)).toBe(false);
  });

  test("admin users: list / get / deactivate blocks login / reactivate", async () => {
    const users = await apiService.admin.getUsers();
    expect(users.some((u) => u.id === S.customer.id)).toBe(true);
    const one = await apiService.admin.getUser(S.customer.id);
    expect(one.email).toBe(CUSTOMER.email);
    expect(one.password).toBeUndefined();
    const off = await apiService.admin.updateUser(S.customer.id, { isActive: false });
    expect(off.isActive).toBe(false);
    const blocked = await expectRejected(apiService.auth.login({ email: CUSTOMER.email, password: CUSTOMER.password }), [403]);
    expect(getErrorMessage(blocked)).toMatch(/deactivated|disabled|inactive/i);
    const on = await apiService.admin.updateUser(S.customer.id, { isActive: true });
    expect(on.isActive).toBe(true);
    const user = await apiService.auth.login({ email: CUSTOMER.email, password: CUSTOMER.password });
    expect(user.id).toBe(S.customer.id);
    rememberCustomer(user);
  });

  // ───────────────────────────── admin settings / config ───────────────────
  test("admin settings: get, patch each section with its current values, unknown section 404", async () => {
    const all = await apiService.admin.getSettings();
    expect(all.store).toBeDefined();
    expect(all.payment).toBeDefined();
    expect(all.social).toBeDefined();
    // The backend answers a section PATCH with that section (02_API_ENDPOINTS
    // says the whole record); AdminSettings ignores the return value and
    // re-reads getSettings(), so both shapes are fine — verify via the re-read.
    const section = (res, key) => (res && res[key]) || res;
    const afterStore = await apiService.admin.updateSettings("store", all.store);
    expect(section(afterStore, "store").name).toBe(all.store.name);
    const afterPayment = await apiService.admin.updateSettings("payment", all.payment);
    expect(section(afterPayment, "payment").codEnabled).toBe(all.payment.codEnabled);
    const afterSocial = await apiService.admin.updateSettings("social", all.social);
    expect(section(afterSocial, "social").instagram).toBe(all.social.instagram);
    await expectRejected(apiService.admin.updateSettings("unknown", {}), [404]);
    // Laravel's ConvertEmptyStringsToNull middleware stores "" as null; the
    // store-settings normaliser treats both as "unset", so compare that way.
    const blankToNull = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === "" ? null : v]));
    const reread = await apiService.admin.getSettings();
    expect(blankToNull(reread.store)).toEqual(blankToNull(all.store));
    expect(blankToNull(reread.payment)).toEqual(blankToNull(all.payment));
    expect(blankToNull(reread.social)).toEqual(blankToNull(all.social));
    // The public read reflects the same record.
    expect((await apiService.settings.get()).store.name).toBe(all.store.name);
  });

  test("admin deals config and hero config: get, put back unchanged", async () => {
    const deals = await apiService.admin.getDealsConfig();
    expect(typeof deals.enabled).toBe("boolean");
    const savedDeals = await apiService.admin.updateDealsConfig(deals);
    expect(savedDeals.enabled).toBe(deals.enabled);
    expect((await apiService.deals.getConfig()).enabled).toBe(deals.enabled);

    const hero = await apiService.admin.getHeroConfig();
    expect(typeof hero.autoplay).toBe("boolean");
    const savedHero = await apiService.admin.updateHeroConfig(hero);
    expect(savedHero.intervalMs).toBe(hero.intervalMs);
    expect((await apiService.hero.getConfig()).intervalMs).toBe(hero.intervalMs);
  });

  test("admin banners: create inactive → hidden from storefront → update → reorder → delete", async () => {
    const created = await apiService.admin.createBanner({
      title: `${TAG} banner`, subtitle: "automated", eyebrow: "", cta: "Shop", link: "/products",
      secondaryCtaLabel: "", secondaryCtaLink: "", backgroundType: "gradient",
      gradient: "linear-gradient(135deg,#000 0%,#333 100%)", image: "", imagePosition: "right center", videoUrl: "",
      videoPoster: "", overlayOpacity: null, textAlign: "left", durationMs: 0, isActive: false, sortOrder: 99,
    });
    expect(created.id).toBeDefined();
    const adminRows = await apiService.admin.getBanners();
    expect(adminRows.some((b) => b.id === created.id)).toBe(true);
    const updated = await apiService.admin.updateBanner(created.id, { ...created, subtitle: "updated" });
    expect(updated.subtitle).toBe("updated");
    const order = adminRows.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((b) => b.id);
    const reordered = await apiService.admin.reorderBanners(order, adminRows);
    expect(reordered).toBeTruthy();
    await apiService.admin.deleteBanner(created.id);
    expect((await apiService.admin.getBanners()).some((b) => b.id === created.id)).toBe(false);
  });

  test("admin FAQs: create inactive → update → reorder → delete", async () => {
    const created = await apiService.admin.createFaq({
      question: `${TAG} question?`, answer: "automated", placements: ["help"], productIds: [], isActive: false, sortOrder: 99,
    });
    expect(created.id).toBeDefined();
    const adminRows = await apiService.admin.getFaqs();
    expect(adminRows.some((f) => f.id === created.id)).toBe(true);
    const updated = await apiService.admin.updateFaq(created.id, { ...created, answer: "updated" });
    expect(updated.answer).toBe("updated");
    const order = adminRows.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((f) => f.id);
    expect(await apiService.admin.reorderFaqs(order, adminRows)).toBeTruthy();
    await apiService.admin.deleteFaq(created.id);
    expect((await apiService.admin.getFaqs()).some((f) => f.id === created.id)).toBe(false);
  });

  test("shiprocket endpoints are wired but not implemented on the backend (documented)", async () => {
    const e1 = await expectRejected(apiService.admin.shiprocketCreateOrder(S.orderA.id));
    const e2 = await expectRejected(apiService.admin.shiprocketTrack("SHIP123"));
    expect(status(e1)).toBeGreaterThanOrEqual(400);
    expect(status(e2)).toBeGreaterThanOrEqual(400);
  });

  // ───────────────────────────── logout ────────────────────────────────────
  test("auth.logout revokes the customer token; a later call is a 401 that clears the session", async () => {
    const token = sessionStorage.getItem("token");
    await apiService.auth.logout();
    expect(authStorage.get("token")).toBeNull();
    expect(authStorage.get("user")).toBeNull();
    // Re-use the revoked token directly: the server must refuse it.
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(S.customer));
    await expectRejected(apiService.auth.getUser(), [401]);
    expect(authStorage.get("token")).toBeNull();
    expect(authStorage.get("user")).toBeNull();
  });

  test("admin.logout revokes the admin token and clears the admin session", async () => {
    const token = sessionStorage.getItem("adminToken");
    // Leave the throwaway customer deactivated so the account can't be used.
    await apiService.admin.updateUser(S.customer.id, { isActive: false });
    await apiService.admin.logout();
    expect(sessionStorage.getItem("adminToken")).toBeNull();
    expect(sessionStorage.getItem("admin")).toBeNull();
    sessionStorage.setItem("adminToken", token);
    await expectRejected(apiService.admin.getProducts(), [401]);
    expect(sessionStorage.getItem("adminToken")).toBeNull();
  });

  afterAll(() => {
    // eslint-disable-next-line no-console
    console.log(`\n[live-api] throwaway customer ${CUSTOMER.email} (id ${S.customer?.id}) deactivated; ` +
      `test orders ${[S.orderA?.orderNumber, S.orderB?.orderNumber, S.orderC?.orderNumber].filter(Boolean).join(", ")} ` +
      `left cancelled/returned; return ${S.returnA?.returnNumber || "-"}.`);
  });
});
