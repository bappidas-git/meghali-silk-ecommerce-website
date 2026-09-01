import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  MenuItem,
  InputAdornment,
  Skeleton,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import apiService from "../../services/api";
import { normalizeHeroConfig, normalizeHeroSlides } from "../../utils/heroConfig";
import { normalizeFaqs } from "../../utils/faqs";
import { SUPPORTED_CURRENCIES } from "../../utils/storeSettings";
import {
  SOCIAL_PLATFORMS,
  normalizeSocialUrl,
  activeSocialLinks,
} from "../../utils/socialLinks";
import { notifyStoreSettingsUpdated } from "../../context/StoreSettingsContext";

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Supported currencies. Selecting one fills in the matching symbol (still
// editable, for currencies/variants not listed here). Shared with the
// storefront so the dropdown and every price agree on what a code prints as.
const CURRENCIES = SUPPORTED_CURRENCIES;

// Every social field starts blank; loadSettings fills in what is saved. Built
// from SOCIAL_PLATFORMS so adding a platform there needs no edit here.
const EMPTY_SOCIAL_FORM = SOCIAL_PLATFORMS.reduce(
  (acc, p) => ({ ...acc, [p.key]: "" }),
  {}
);

// What the admin typed will be repaired on save (a bare handle gets an https://
// prefix, a WhatsApp phone number becomes a wa.me link). This flags the values
// that cannot be repaired into a link at all, so the field says so before the
// save rather than the storefront printing a broken mark afterwards.
const socialFieldError = (value, key) => {
  const repaired = normalizeSocialUrl(value, key);
  if (!repaired) return "";
  try {
    const url = new URL(repaired);
    if (!/^https?:$/.test(url.protocol)) return "Use an http:// or https:// link";
    if (!url.hostname.includes(".")) return "That does not look like a web address";
    return "";
  } catch {
    return "That does not look like a web address";
  }
};

const AdminSettings = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryCount, setCategoryCount] = useState(null);
  // Surfaced on the Hero Section tab so the pointer card can say what is
  // currently live without an admin having to open the manager to find out.
  const [heroSummary, setHeroSummary] = useState(null);
  // Same idea for the FAQs manager: how many answers are written, and how many
  // of them a shopper can currently read.
  const [faqSummary, setFaqSummary] = useState(null);

  // General settings forms (backed by db.json `settings.store` + `settings.payment`)
  const [storeForm, setStoreForm] = useState({
    name: "",
    tagline: "",
    email: "",
    phone: "",
    address: "",
    currency: "INR",
    currencySymbol: "₹",
    taxRate: 0,
    taxIncluded: false,
  });
  const [paymentForm, setPaymentForm] = useState({
    codEnabled: true,
    codFee: 0,
    codMinOrder: 0,
    codMaxOrder: 0,
  });

  // Social links (backed by db.json `settings.social`) — saved on their own tab
  // and their own button, so a URL change never re-writes the store's identity.
  const [socialForm, setSocialForm] = useState(EMPTY_SOCIAL_FORM);
  const [savingSocial, setSavingSocial] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settings, cats, heroConfig, heroSlides, faqRows] = await Promise.all([
        apiService.admin.getSettings(),
        apiService.admin.getCategories().catch(() => []),
        apiService.admin.getHeroConfig().catch(() => null),
        apiService.admin.getBanners().catch(() => []),
        apiService.admin.getFaqs().catch(() => []),
      ]);
      const store = settings?.store || {};
      const payment = settings?.payment || {};
      setStoreForm({
        name: store.name || "",
        tagline: store.tagline || "",
        email: store.email || "",
        phone: store.phone || "",
        address: store.address || "",
        currency: store.currency || "INR",
        currencySymbol: store.currencySymbol || "₹",
        taxRate: store.taxRate ?? 0,
        taxIncluded: !!store.taxIncluded,
      });
      setPaymentForm({
        codEnabled: payment.codEnabled !== false,
        codFee: payment.codFee ?? 0,
        codMinOrder: payment.codMinOrder ?? 0,
        codMaxOrder: payment.codMaxOrder ?? 0,
      });
      // Raw, not normalised: the field shows exactly what was saved so an admin
      // recognises their own typing. Repair happens on the way back out.
      const social = settings?.social || {};
      setSocialForm(
        SOCIAL_PLATFORMS.reduce(
          (acc, p) => ({ ...acc, [p.key]: social[p.key] || "" }),
          {}
        )
      );
      setCategoryCount(Array.isArray(cats) ? cats.length : 0);
      const slides = normalizeHeroSlides(heroSlides);
      setHeroSummary({
        enabled: normalizeHeroConfig(heroConfig).enabled,
        total: slides.length,
        live: slides.filter((s) => s.isActive).length,
      });
      const answers = normalizeFaqs(faqRows);
      setFaqSummary({
        total: answers.length,
        live: answers.filter((f) => f.isActive).length,
        onProduct: answers.filter(
          (f) => f.isActive && f.placements.includes("product")
        ).length,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      setSnackbar({ open: true, message: "Failed to load settings", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const handleStoreChange = (field, value) =>
    setStoreForm((prev) => ({ ...prev, [field]: value }));

  const handleCurrencyChange = (code) => {
    const found = CURRENCIES.find((c) => c.code === code);
    setStoreForm((prev) => ({
      ...prev,
      currency: code,
      currencySymbol: found ? found.symbol : prev.currencySymbol,
    }));
  };

  const handlePaymentChange = (field, value) =>
    setPaymentForm((prev) => ({ ...prev, [field]: value }));

  const handleSocialChange = (key, value) =>
    setSocialForm((prev) => ({ ...prev, [key]: value }));

  const handleSaveGeneral = async () => {
    if (!storeForm.name.trim()) {
      setSnackbar({ open: true, message: "Store name is required", severity: "error" });
      return;
    }
    const taxRate = Number(storeForm.taxRate);
    if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      setSnackbar({ open: true, message: "Tax rate must be between 0 and 100", severity: "error" });
      return;
    }

    try {
      setSaving(true);
      // Two sections, persisted in sequence. The mock branch re-reads settings
      // between calls, so the payment write sees the freshly-saved store write.
      await apiService.admin.updateSettings("store", {
        name: storeForm.name.trim(),
        tagline: storeForm.tagline.trim(),
        email: storeForm.email.trim(),
        phone: storeForm.phone.trim(),
        address: storeForm.address.trim(),
        currency: storeForm.currency,
        currencySymbol: storeForm.currencySymbol,
        taxRate,
        taxIncluded: storeForm.taxIncluded,
      });
      await apiService.admin.updateSettings("payment", {
        codEnabled: paymentForm.codEnabled,
        codFee: Number(paymentForm.codFee) || 0,
        codMinOrder: Number(paymentForm.codMinOrder) || 0,
        codMaxOrder: Number(paymentForm.codMaxOrder) || 0,
      });
      setSnackbar({ open: true, message: "Settings saved successfully", severity: "success" });
      // Tell every StoreSettingsProvider consumer to refetch, so the admin shell
      // and any storefront tab pick the new name, currency, contact details, tax
      // rate and COD rules up without a reload.
      notifyStoreSettingsUpdated();
      // Reload so the form reflects exactly what was persisted.
      loadSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || "Failed to save settings",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocial = async () => {
    // Blank is legal and meaningful — it is how a mark is taken off the
    // storefront — so only values that cannot be repaired into a link block the
    // save, and the offending field is named.
    const bad = SOCIAL_PLATFORMS.find((p) => socialFieldError(socialForm[p.key], p.key));
    if (bad) {
      setSnackbar({
        open: true,
        message: `${bad.label}: ${socialFieldError(socialForm[bad.key], bad.key)}`,
        severity: "error",
      });
      return;
    }

    try {
      setSavingSocial(true);
      // Persist the repaired value, not the raw one, so every consumer reads a
      // complete href and no surface has to guess at a missing scheme.
      const payload = SOCIAL_PLATFORMS.reduce(
        (acc, p) => ({ ...acc, [p.key]: normalizeSocialUrl(socialForm[p.key], p.key) }),
        {}
      );
      await apiService.admin.updateSettings("social", payload);
      setSnackbar({ open: true, message: "Social links saved", severity: "success" });
      // Same broadcast the General tab uses: every storefront tab already open
      // re-reads the settings record and repaints its footer row.
      notifyStoreSettingsUpdated();
      loadSettings();
    } catch (error) {
      console.error("Error saving social links:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || "Failed to save social links",
        severity: "error",
      });
    } finally {
      setSavingSocial(false);
    }
  };

  const symbol = storeForm.currencySymbol || "₹";

  // Exactly what the footer will render: the same helper the storefront calls,
  // fed the repaired values, so the preview cannot drift from the real row.
  const socialPreview = activeSocialLinks(
    SOCIAL_PLATFORMS.reduce(
      (acc, p) => ({ ...acc, [p.key]: normalizeSocialUrl(socialForm[p.key], p.key) }),
      {}
    )
  );

  const sectionCardSx = { height: "100%" };

  const renderGeneralSkeleton = () => (
    <Grid container spacing={3}>
      {[0, 1].map((i) => (
        <Grid item xs={12} md={6} key={i}>
          <Card sx={sectionCardSx}>
            <CardContent>
              <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} variant="rounded" height={48} sx={{ mb: 2 }} />
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Settings
        </Typography>
        <Typography color="text.secondary">
          Store configuration that powers your storefront and checkout
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
          }}
        >
          <Tab icon={<Icon icon="mdi:cog" style={{ fontSize: 20 }} />} iconPosition="start" label="General" />
          <Tab icon={<Icon icon="mdi:folder-multiple" style={{ fontSize: 20 }} />} iconPosition="start" label="Categories" />
          <Tab icon={<Icon icon="mdi:view-carousel-outline" style={{ fontSize: 20 }} />} iconPosition="start" label="Hero Section" />
          <Tab icon={<Icon icon="mdi:comment-question-outline" style={{ fontSize: 20 }} />} iconPosition="start" label="FAQs" />
          <Tab icon={<Icon icon="mdi:share-variant" style={{ fontSize: 20 }} />} iconPosition="start" label="Social Links" />
        </Tabs>
      </Paper>

      {/* General Tab */}
      <TabPanel value={activeTab} index={0}>
        {loading ? (
          renderGeneralSkeleton()
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 3,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                These values are saved to your store settings and read by the storefront and checkout.
              </Typography>
              <Button
                variant="contained"
                onClick={handleSaveGeneral}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Icon icon="mdi:content-save" />}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>

            <Grid container spacing={3}>
              {/* Store Information */}
              <Grid item xs={12} md={6}>
                <Card sx={sectionCardSx}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Icon icon="mdi:store" style={{ fontSize: 24, marginRight: 8 }} />
                      <Typography variant="h6">Store Information</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Store Name" value={storeForm.name} onChange={(e) => handleStoreChange("name", e.target.value)} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Tagline" value={storeForm.tagline} onChange={(e) => handleStoreChange("tagline", e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Email" type="email" value={storeForm.email} onChange={(e) => handleStoreChange("email", e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Phone" value={storeForm.phone} onChange={(e) => handleStoreChange("phone", e.target.value)} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Address" value={storeForm.address} onChange={(e) => handleStoreChange("address", e.target.value)} multiline rows={2} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Currency & Tax */}
              <Grid item xs={12} md={6}>
                <Card sx={sectionCardSx}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Icon icon="mdi:cash-multiple" style={{ fontSize: 24, marginRight: 8 }} />
                      <Typography variant="h6">Currency &amp; Tax</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField select fullWidth size="small" label="Currency" value={storeForm.currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
                          {CURRENCIES.map((c) => (
                            <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Currency Symbol" value={storeForm.currencySymbol} onChange={(e) => handleStoreChange("currencySymbol", e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Tax Rate"
                          type="number"
                          value={storeForm.taxRate}
                          onChange={(e) => handleStoreChange("taxRate", e.target.value)}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                          inputProps={{ min: 0, max: 100, step: 0.5 }}
                          helperText="Applied to the order subtotal at checkout"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          sx={{ mt: 1 }}
                          control={<Switch checked={storeForm.taxIncluded} onChange={(e) => handleStoreChange("taxIncluded", e.target.checked)} />}
                          label="Prices include tax"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cash on Delivery */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Icon icon="mdi:cash-fast" style={{ fontSize: 24, marginRight: 8 }} />
                        <Typography variant="h6">Cash on Delivery (COD)</Typography>
                      </Box>
                      <FormControlLabel
                        control={<Switch checked={paymentForm.codEnabled} onChange={(e) => handlePaymentChange("codEnabled", e.target.checked)} />}
                        label={paymentForm.codEnabled ? "Enabled" : "Disabled"}
                      />
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth size="small" label="COD Fee" type="number"
                          value={paymentForm.codFee}
                          onChange={(e) => handlePaymentChange("codFee", e.target.value)}
                          disabled={!paymentForm.codEnabled}
                          InputProps={{ startAdornment: <InputAdornment position="start">{symbol}</InputAdornment> }}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth size="small" label="Min Order" type="number"
                          value={paymentForm.codMinOrder}
                          onChange={(e) => handlePaymentChange("codMinOrder", e.target.value)}
                          disabled={!paymentForm.codEnabled}
                          InputProps={{ startAdornment: <InputAdornment position="start">{symbol}</InputAdornment> }}
                          inputProps={{ min: 0 }}
                          helperText="0 = no minimum"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth size="small" label="Max Order" type="number"
                          value={paymentForm.codMaxOrder}
                          onChange={(e) => handlePaymentChange("codMaxOrder", e.target.value)}
                          disabled={!paymentForm.codEnabled}
                          InputProps={{ startAdornment: <InputAdornment position="start">{symbol}</InputAdornment> }}
                          inputProps={{ min: 0 }}
                          helperText="0 = no maximum"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </TabPanel>

      {/* Categories Tab — reconciled: one canonical manager lives at /admin/categories */}
      <TabPanel value={activeTab} index={1}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider" }} elevation={0}>
          <Box sx={{ maxWidth: 520, mx: "auto", textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
              }}
            >
              <Icon icon="mdi:folder-multiple" style={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Manage categories in one place
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Category management lives in the dedicated <strong>Categories</strong> manager — image,
              slug, parent hierarchy, sort order and status — so the storefront and admin never
              diverge.
            </Typography>
            {categoryCount !== null && (
              <Chip
                icon={<Icon icon="mdi:shape-outline" />}
                label={`${categoryCount} ${categoryCount === 1 ? "category" : "categories"} configured`}
                sx={{ mb: 3 }}
              />
            )}
            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Icon icon="mdi:folder-cog" />}
                onClick={() => navigate("/admin/categories")}
              >
                Open Category Manager
              </Button>
            </Box>
          </Box>
        </Paper>
      </TabPanel>

      {/* Hero Section Tab — same reconciliation as Categories: one canonical
          manager lives at /admin/hero-section, and Settings points at it. */}
      <TabPanel value={activeTab} index={2}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider" }} elevation={0}>
          <Box sx={{ maxWidth: 560, mx: "auto", textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
              }}
            >
              <Icon icon="mdi:view-carousel-outline" style={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Manage the home page hero
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Every slide and every behaviour of the opening band lives in the dedicated{" "}
              <strong>Hero Section</strong> manager — slide copy and buttons, background gradient,
              image or video, per-slide timers, transition, overlay, the visible controls and the
              stage height for desktop, tablet and mobile.
            </Typography>
            {heroSummary && (
              <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap", mb: 3 }}>
                <Chip
                  icon={<Icon icon={heroSummary.enabled ? "mdi:eye-outline" : "mdi:eye-off-outline"} />}
                  color={heroSummary.enabled ? "success" : "warning"}
                  label={heroSummary.enabled ? "Hero is showing" : "Hero is switched off"}
                />
                <Chip
                  icon={<Icon icon="mdi:image-multiple-outline" />}
                  label={`${heroSummary.live} live of ${heroSummary.total} ${
                    heroSummary.total === 1 ? "slide" : "slides"
                  }`}
                />
              </Box>
            )}
            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Icon icon="mdi:image-edit-outline" />}
                onClick={() => navigate("/admin/hero-section")}
              >
                Open Hero Section Manager
              </Button>
            </Box>
          </Box>
        </Paper>
      </TabPanel>

      {/* FAQs Tab — the same reconciliation again: the answers live in one
          manager at /admin/faqs, and Settings only points at it. */}
      <TabPanel value={activeTab} index={3}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider" }} elevation={0}>
          <Box sx={{ maxWidth: 560, mx: "auto", textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
              }}
            >
              <Icon icon="mdi:comment-question-outline" style={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Manage the answered questions
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Every FAQ on the storefront lives in the dedicated <strong>FAQs</strong> manager — the
              question and its answer, the order they are read in, whether each one appears in the
              FAQs tab of a product page, in the Help Centre or in the shared FAQ block, and which
              products it is written for.
            </Typography>
            {faqSummary && (
              <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap", mb: 3 }}>
                <Chip
                  icon={<Icon icon={faqSummary.live > 0 ? "mdi:eye-outline" : "mdi:eye-off-outline"} />}
                  color={faqSummary.live > 0 ? "success" : "warning"}
                  label={`${faqSummary.live} live of ${faqSummary.total} ${
                    faqSummary.total === 1 ? "answer" : "answers"
                  }`}
                />
                <Chip
                  icon={<Icon icon="mdi:package-variant-closed" />}
                  label={`${faqSummary.onProduct} on product pages`}
                />
              </Box>
            )}
            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Icon icon="mdi:comment-edit-outline" />}
                onClick={() => navigate("/admin/faqs")}
              >
                Open FAQ Manager
              </Button>
            </Box>
          </Box>
        </Paper>
      </TabPanel>


      {/* Social Links Tab — unlike Categories / Hero / FAQs this one is edited
          in place: it is five URLs on the same settings record the General tab
          writes, not a collection that needs a manager of its own. Its own Save
          button writes only the `social` section, so moving an Instagram handle
          can never re-write the store's name or currency. */}
      <TabPanel value={activeTab} index={4}>
        {loading ? (
          <Card>
            <CardContent>
              <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
              {SOCIAL_PLATFORMS.map((p) => (
                <Skeleton key={p.key} variant="rounded" height={48} sx={{ mb: 2 }} />
              ))}
            </CardContent>
          </Card>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 3,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Where the marks in the storefront footer and on the Contact page point.
                Leave a field empty to take that icon off the site.
              </Typography>
              <Button
                variant="contained"
                onClick={handleSaveSocial}
                disabled={savingSocial}
                startIcon={
                  savingSocial ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Icon icon="mdi:content-save" />
                  )
                }
              >
                {savingSocial ? "Saving..." : "Save Changes"}
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card sx={sectionCardSx}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Icon icon="mdi:link-variant" style={{ fontSize: 24, marginRight: 8 }} />
                      <Typography variant="h6">Profile Links</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={2}>
                      {SOCIAL_PLATFORMS.map((platform) => {
                        const value = socialForm[platform.key] || "";
                        const error = socialFieldError(value, platform.key);
                        return (
                          <Grid item xs={12} key={platform.key}>
                            <TextField
                              fullWidth
                              size="small"
                              label={platform.label}
                              value={value}
                              onChange={(e) => handleSocialChange(platform.key, e.target.value)}
                              placeholder={platform.placeholder}
                              error={!!error}
                              helperText={
                                error ||
                                (platform.key === "whatsapp"
                                  ? "A wa.me link, or just the number with its country code"
                                  : "Empty hides this icon on the storefront")
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Icon icon={platform.adminIcon} style={{ fontSize: 20 }} />
                                  </InputAdornment>
                                ),
                                endAdornment:
                                  value && !error ? (
                                    <InputAdornment position="end">
                                      <Button
                                        size="small"
                                        component="a"
                                        href={normalizeSocialUrl(value, platform.key)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ minWidth: 0, px: 1 }}
                                        aria-label={"Open the " + platform.label + " link in a new tab"}
                                      >
                                        <Icon icon="mdi:open-in-new" style={{ fontSize: 18 }} />
                                      </Button>
                                    </InputAdornment>
                                  ) : null,
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Preview — built by the same activeSocialLinks() the storefront
                  calls, on a deep ground like the footer band, so what an admin
                  approves here is the row a shopper actually gets. */}
              <Grid item xs={12} md={5}>
                <Card sx={sectionCardSx}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Icon icon="mdi:eye-outline" style={{ fontSize: 24, marginRight: 8 }} />
                      <Typography variant="h6">On the storefront</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Box
                      sx={{
                        bgcolor: "grey.900",
                        // The admin's own card is already dark in dark mode, so
                        // the strip needs an edge to still read as the footer's
                        // separate band rather than more card.
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        px: { xs: 1.5, sm: 2 },
                        py: 2,
                        mb: 2,
                      }}
                    >
                      {socialPreview.length > 0 ? (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {socialPreview.map((social) => (
                            <Box
                              key={social.key}
                              component="a"
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={social.label}
                              title={social.url}
                              sx={{
                                width: 44,
                                height: 44,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 1,
                                color: "grey.400",
                                transition: "color .2s",
                                "&:hover": { color: "common.white" },
                              }}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                width="18"
                                height="18"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path d={social.path} />
                              </svg>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: "grey.500", py: 1.5 }}>
                          No links set — the footer will show no social row at all.
                        </Typography>
                      )}
                    </Box>

                    <Chip
                      size="small"
                      icon={
                        <Icon
                          icon={
                            socialPreview.length > 0 ? "mdi:eye-outline" : "mdi:eye-off-outline"
                          }
                        />
                      }
                      color={socialPreview.length > 0 ? "success" : "warning"}
                      label={socialPreview.length + " of " + SOCIAL_PLATFORMS.length + " showing"}
                      sx={{ mb: 2 }}
                    />

                    <Alert severity="info" icon={<Icon icon="mdi:information-outline" />}>
                      Saved links appear in the footer of every storefront page and in the
                      Follow our journey card on Contact — on phones, tablets and desktop
                      alike. Tabs already open pick the change up without a reload.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </TabPanel>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default AdminSettings;
