import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Slider,
  Skeleton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import apiService from "../../services/api";
import {
  DEFAULT_HERO_CONFIG,
  DEFAULT_HERO_SLIDE,
  HERO_BACKGROUND_TYPES,
  HERO_DEVICES,
  HERO_IMAGE_POSITIONS,
  HERO_MAX_DURATION_MS,
  HERO_MIN_DURATION_MS,
  HERO_TEXT_ALIGNMENTS,
  HERO_TRANSITIONS,
  clampInt,
  heroSlideDuration,
  heroSlideOverlay,
  normalizeHeroConfig,
  normalizeHeroSlide,
  normalizeHeroSlides,
} from "../../utils/heroConfig";

// =============================================================================
// Admin → Storefront → Hero Section
// =============================================================================
// One screen for the entire home-page hero. Two records back it:
//
//   SLIDES   the `banners` collection — one row each, with its own copy, CTAs,
//            background (gradient / image / video), alignment, scrim, timer,
//            order and on/off switch.
//   SECTION  the `heroConfig` singleton — the master toggle, autoplay and the
//            default timer, the transition, which chrome shows, the scrim
//            strength, the stage height for desktop/tablet/mobile, the shared
//            secondary CTA and the collection-openers row.
//
// Nothing about the hero is hardcoded on the storefront any more: it reads
// exactly what is saved here. The live preview below renders from the same
// normalizers the storefront uses, so what an admin sees is what ships.
// =============================================================================

const toast = (icon, title, text) =>
  Swal.fire({
    icon,
    title,
    text,
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: icon === "error" ? 4000 : 2500,
  });

// On-brand grounds an admin can pick without writing CSS. The first is the
// shared token (it follows the theme); the rest are the ink-to-gold casts the
// four seeded slides ship with, so a new slide can match them exactly.
const GRADIENT_PRESETS = [
  { label: "Heritage", value: "var(--sf-gradient-heritage)" },
  { label: "Bridal Muga", value: "linear-gradient(135deg,#1D1A16 0%,#3A2E1B 60%,#8A6118 100%)" },
  { label: "Sualkuchi", value: "linear-gradient(135deg,#322C25 0%,#6B5030 55%,#C8912A 100%)" },
  { label: "Bihu Night", value: "linear-gradient(135deg,#0F0D0A 0%,#5C554A 50%,#8A6118 100%)" },
  { label: "Eri Warmth", value: "linear-gradient(135deg,#1D1A16 0%,#4A3F31 55%,#AF7E26 100%)" },
];

const typeMeta = (value) =>
  HERO_BACKGROUND_TYPES.find((t) => t.value === value) || HERO_BACKGROUND_TYPES[0];

// Seconds in the inputs, milliseconds in the record — one place to convert.
const msToSeconds = (ms) => Math.round((Number(ms) || 0) / 100) / 10;
const secondsToMs = (s) => Math.round((Number(s) || 0) * 1000);

// ─── Live slide preview ──────────────────────────────────────────────────────
// A miniature of the real stage: same layer order (ground → media → scrim →
// copy), same alignment rules, same --sf-* tokens. Used both as the row
// thumbnail (compact) and as the editor preview (full).
const SlidePreview = ({ slide, config, compact = false }) => {
  const align = slide.textAlign || "left";
  const scrim = heroSlideOverlay(slide, config) / 100;
  const items =
    align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  // The scrim leans towards the copy, exactly as the stylesheet does.
  const scrimImage =
    align === "center"
      ? "linear-gradient(0deg, rgba(15,13,10,0.88) 0%, rgba(15,13,10,0.55) 55%, rgba(15,13,10,0.30) 100%)"
      : align === "right"
      ? "linear-gradient(270deg, rgba(15,13,10,0.88) 0%, rgba(15,13,10,0.62) 42%, transparent 80%)"
      : "linear-gradient(90deg, rgba(15,13,10,0.88) 0%, rgba(15,13,10,0.62) 42%, transparent 80%)";

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: compact ? "16 / 9" : "16 / 7",
        minHeight: compact ? 72 : 160,
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#1D1A16",
      }}
    >
      {/* Ground — always painted, so it backs a loading image or a letterboxed video. */}
      <Box
        sx={{ position: "absolute", inset: 0 }}
        style={{ background: slide.gradient || "var(--sf-gradient-heritage)" }}
      />

      {slide.backgroundType === "image" && slide.image && (
        <Box
          component="img"
          src={slide.image}
          alt=""
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          style={{ objectPosition: slide.imagePosition }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      {slide.backgroundType === "video" && (slide.videoUrl || slide.videoPoster) && (
        <Box
          component="video"
          src={slide.videoUrl || undefined}
          poster={slide.videoPoster || undefined}
          muted
          loop
          autoPlay
          playsInline
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          style={{ objectPosition: slide.imagePosition }}
        />
      )}

      <Box sx={{ position: "absolute", inset: 0, opacity: scrim }} style={{ backgroundImage: scrimImage }} />

      {/* Copy */}
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: items,
          textAlign: align === "center" ? "center" : align === "right" ? "right" : "left",
          p: compact ? 1 : { xs: 2, sm: 3 },
          gap: compact ? 0.25 : 0.75,
          color: "#F7F3EC",
        }}
      >
        {!compact && (slide.eyebrow || "") !== "" && (
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#D9A441",
              fontWeight: 600,
            }}
          >
            {slide.eyebrow}
          </Typography>
        )}
        <Typography
          sx={{
            fontFamily: "var(--sf-font-display, Georgia, serif)",
            fontWeight: 500,
            lineHeight: 1.1,
            fontSize: compact ? 13 : { xs: 20, sm: 28 },
            // The real headline is capped at 18ch; keep the preview honest.
            maxWidth: "18ch",
          }}
          noWrap={compact}
        >
          {slide.title || "Untitled slide"}
        </Typography>
        {!compact && slide.subtitle && (
          <Typography sx={{ fontSize: { xs: 12, sm: 13 }, opacity: 0.82, maxWidth: "46ch" }}>
            {slide.subtitle}
          </Typography>
        )}
        {!compact && (slide.cta || slide.secondaryCtaLabel) && (
          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", justifyContent: items }}>
            {slide.cta && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 0.5,
                  color: "#1D1A16",
                  background: "linear-gradient(135deg,#D9A441,#C8912A)",
                }}
              >
                {slide.cta}
              </Box>
            )}
            {(slide.secondaryCtaLabel || config?.secondaryCta?.label) &&
              config?.secondaryCta?.enabled !== false && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 0.5,
                    border: "1px solid rgba(247,243,236,0.28)",
                  }}
                >
                  {slide.secondaryCtaLabel || config.secondaryCta.label}
                </Box>
              )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ─── One slide row in the list ───────────────────────────────────────────────
const SlideRow = ({
  slide,
  config,
  index,
  total,
  busy,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
  onMove,
}) => {
  const meta = typeMeta(slide.backgroundType);
  const duration = heroSlideDuration(slide, config);
  return (
    <Card
      sx={{
        opacity: slide.isActive ? 1 : 0.62,
        borderLeft: "3px solid",
        borderLeftColor: slide.isActive ? "success.main" : "divider",
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Grid container spacing={2} alignItems="center">
          {/* Order controls */}
          <Grid item xs="auto">
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <IconButton
                size="small"
                disabled={index === 0 || busy}
                onClick={() => onMove(index, -1)}
                aria-label="Move slide up"
              >
                <Icon icon="mdi:chevron-up" />
              </IconButton>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {String(index + 1).padStart(2, "0")}
              </Typography>
              <IconButton
                size="small"
                disabled={index === total - 1 || busy}
                onClick={() => onMove(index, 1)}
                aria-label="Move slide down"
              >
                <Icon icon="mdi:chevron-down" />
              </IconButton>
            </Box>
          </Grid>

          {/* Thumbnail */}
          <Grid item xs={12} sm={3} md={2.5}>
            <SlidePreview slide={slide} config={config} compact />
          </Grid>

          {/* Copy summary */}
          <Grid item xs={12} sm md>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
              {slide.title || "Untitled slide"}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {slide.subtitle || "No supporting line"}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              <Chip size="small" icon={<Icon icon={meta.icon} />} label={meta.label} />
              <Chip
                size="small"
                icon={<Icon icon="mdi:timer-outline" />}
                label={
                  slide.durationMs
                    ? `${msToSeconds(slide.durationMs)}s`
                    : `${msToSeconds(duration)}s (default)`
                }
              />
              <Chip
                size="small"
                icon={<Icon icon="mdi:link-variant" />}
                label={slide.link || "/products"}
              />
            </Box>
          </Grid>

          {/* Row actions */}
          <Grid item xs={12} md="auto">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "space-between", md: "flex-end" },
                gap: 0.5,
              }}
            >
              <FormControlLabel
                sx={{ mr: 0.5 }}
                control={
                  <Switch
                    size="small"
                    checked={slide.isActive}
                    disabled={busy}
                    onChange={() => onToggleActive(slide)}
                  />
                }
                label={
                  <Typography variant="caption">{slide.isActive ? "Live" : "Hidden"}</Typography>
                }
              />
              <Tooltip title="Edit slide">
                <span>
                  {/* The Tooltip wraps a <span> so it still shows on a disabled
                      button, which means it cannot label the button itself —
                      each one carries its own aria-label. */}
                  <IconButton
                    size="small"
                    aria-label={`Edit slide: ${slide.title || "Untitled slide"}`}
                    onClick={() => onEdit(slide)}
                    disabled={busy}
                  >
                    <Icon icon="mdi:pencil-outline" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Duplicate slide">
                <span>
                  <IconButton
                    size="small"
                    aria-label={`Duplicate slide: ${slide.title || "Untitled slide"}`}
                    onClick={() => onDuplicate(slide)}
                    disabled={busy}
                  >
                    <Icon icon="mdi:content-copy" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Delete slide">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Delete slide: ${slide.title || "Untitled slide"}`}
                    onClick={() => onDelete(slide)}
                    disabled={busy}
                  >
                    <Icon icon="mdi:delete-outline" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const AdminHeroSection = () => {
  const fullScreenDialog = useMediaQuery("(max-width:599.95px)");

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState(() => normalizeHeroConfig(null));
  const [slides, setSlides] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_HERO_SLIDE);
  const [savingSlide, setSavingSlide] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cfg, rows] = await Promise.all([
        apiService.admin.getHeroConfig().catch(() => null),
        apiService.admin.getBanners().catch(() => []),
      ]);
      setConfig(normalizeHeroConfig(cfg));
      setSlides(normalizeHeroSlides(rows));
    } catch (error) {
      console.error("Error loading hero section:", error);
      setSnackbar({ open: true, message: "Failed to load the hero section", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = useMemo(() => slides.filter((s) => s.isActive).length, [slides]);

  // ── Section config ─────────────────────────────────────────────────────────
  const setCfg = (patch) => setConfig((prev) => ({ ...prev, ...patch }));
  const setNested = (key, patch) =>
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  const setHeight = (device, field, value) =>
    setConfig((prev) => ({
      ...prev,
      heights: {
        ...prev.heights,
        [device]: { ...prev.heights[device], [field]: value },
      },
    }));

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      // Normalize before sending so the record on disk is always in range,
      // whatever a half-typed number field held at the moment of saving.
      const payload = normalizeHeroConfig(config);
      await apiService.admin.updateHeroConfig(payload);
      setConfig(payload);
      setSnackbar({ open: true, message: "Hero settings saved", severity: "success" });
    } catch (error) {
      console.error("Error saving hero config:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || "Failed to save",
        severity: "error",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  // ── Slides ─────────────────────────────────────────────────────────────────
  const openCreate = () => {
    const maxSort = slides.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), -1);
    setEditing(null);
    setForm({ ...DEFAULT_HERO_SLIDE, sortOrder: maxSort + 1 });
    setDialogOpen(true);
  };

  const openEdit = (slide) => {
    setEditing(slide);
    setForm({ ...DEFAULT_HERO_SLIDE, ...slide });
    setDialogOpen(true);
  };

  // Strip the identity/audit fields so a saved slide only ever carries hero
  // data — ids are the store's to assign, timestamps the API layer's to stamp.
  const slidePayload = (slide) => {
    const { id, createdAt, updatedAt, imageUrl, ...rest } = normalizeHeroSlide(slide);
    return rest;
  };

  const handleSaveSlide = async () => {
    if (!form.title.trim()) {
      toast("warning", "A headline is required");
      return;
    }
    try {
      setSavingSlide(true);
      const payload = slidePayload({ ...form, title: form.title.trim() });
      if (editing) {
        await apiService.admin.updateBanner(editing.id, payload);
      } else {
        await apiService.admin.createBanner(payload);
      }
      setDialogOpen(false);
      await load();
      toast("success", editing ? "Slide updated" : "Slide added");
    } catch (error) {
      console.error("Error saving slide:", error);
      toast("error", "Could not save the slide", error.message);
    } finally {
      setSavingSlide(false);
    }
  };

  const handleDuplicate = async (slide) => {
    try {
      setBusy(true);
      const maxSort = slides.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), -1);
      await apiService.admin.createBanner(
        slidePayload({
          ...slide,
          title: `${slide.title} (copy)`,
          // A duplicate arrives hidden, so it can be edited before it goes out.
          isActive: false,
          sortOrder: maxSort + 1,
        })
      );
      await load();
      toast("success", "Slide duplicated", "The copy is hidden until you switch it on.");
    } catch (error) {
      console.error("Error duplicating slide:", error);
      toast("error", "Could not duplicate the slide", error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (slide) => {
    // The storefront falls back to its built-in slide when nothing is live, so
    // an admin should know before they empty the carousel.
    const lastLive = slide.isActive && activeCount === 1;
    const result = await Swal.fire({
      title: "Delete this slide?",
      html: `<strong>${slide.title || "Untitled slide"}</strong> will be permanently removed.${
        lastLive
          ? "<br/><br/>It is the only live slide — the hero will fall back to its built-in slide until you add another."
          : ""
      }`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      setBusy(true);
      await apiService.admin.deleteBanner(slide.id);
      await load();
      toast("success", "Slide deleted");
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast("error", "Could not delete the slide", error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (slide) => {
    const isActive = !slide.isActive;
    // Optimistic — the switch has to answer immediately.
    setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, isActive } : s)));
    try {
      setBusy(true);
      await apiService.admin.updateBanner(slide.id, slidePayload({ ...slide, isActive }));
    } catch (error) {
      console.error("Error toggling slide:", error);
      toast("error", "Could not update the slide", error.message);
      load(); // roll back to server truth
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    // Renumber from the top so the order is dense and stable.
    const renumbered = next.map((s, i) => ({ ...s, sortOrder: i }));
    setSlides(renumbered);
    try {
      setBusy(true);
      await apiService.admin.reorderBanners(
        renumbered.map((s) => s.id),
        slides
      );
    } catch (error) {
      console.error("Error reordering slides:", error);
      toast("error", "Could not save the new order", error.message);
      load();
    } finally {
      setBusy(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const renderSkeleton = () => (
    <Box sx={{ display: "grid", gap: 2 }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" height={132} />
      ))}
    </Box>
  );

  const sectionHeader = (icon, title, description) => (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Icon icon={icon} style={{ fontSize: 22 }} />
        <Typography variant="h6">{title}</Typography>
      </Box>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      <Divider sx={{ mb: 2.5 }} />
    </>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Hero Section
        </Typography>
        <Typography color="text.secondary">
          The opening band of the storefront home page — its slides, their backgrounds and copy, and
          how the whole carousel behaves on every device.
        </Typography>
      </Box>

      {!loading && !config.enabled && (
        <Alert
          severity="warning"
          icon={<Icon icon="mdi:eye-off-outline" />}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setTab(1)}>
              Section settings
            </Button>
          }
        >
          The hero section is switched off — the storefront home page currently opens straight into
          its first content section.
        </Alert>
      )}

      <Paper sx={{ mb: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
          }}
        >
          <Tab
            icon={<Icon icon="mdi:view-carousel-outline" style={{ fontSize: 20 }} />}
            iconPosition="start"
            label={`Slides${loading ? "" : ` (${slides.length})`}`}
          />
          <Tab
            icon={<Icon icon="mdi:tune-variant" style={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Section settings"
          />
        </Tabs>
      </Paper>

      {/* ── SLIDES ────────────────────────────────────────────────────────── */}
      {tab === 0 &&
        (loading ? (
          renderSkeleton()
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  size="small"
                  color={activeCount > 0 ? "success" : "warning"}
                  icon={<Icon icon="mdi:broadcast" />}
                  label={`${activeCount} live`}
                />
                {slides.length - activeCount > 0 && (
                  <Chip
                    size="small"
                    icon={<Icon icon="mdi:eye-off-outline" />}
                    label={`${slides.length - activeCount} hidden`}
                  />
                )}
                <Typography variant="body2" color="text.secondary">
                  Shown in this order, top first.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Icon icon="mdi:plus" />}
                onClick={openCreate}
                disabled={busy}
              >
                Add Slide
              </Button>
            </Box>

            {slides.length === 0 ? (
              <Paper
                elevation={0}
                sx={{ p: { xs: 4, sm: 6 }, textAlign: "center", border: "1px dashed", borderColor: "divider" }}
              >
                <Icon icon="mdi:image-multiple-outline" style={{ fontSize: 48, opacity: 0.4 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  No slides yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  The storefront is showing its built-in fallback slide. Add one to take it over.
                </Typography>
                <Button variant="contained" startIcon={<Icon icon="mdi:plus" />} onClick={openCreate}>
                  Add the first slide
                </Button>
              </Paper>
            ) : (
              <Box sx={{ display: "grid", gap: 2 }}>
                {slides.map((slide, index) => (
                  <SlideRow
                    key={slide.id}
                    slide={slide}
                    config={config}
                    index={index}
                    total={slides.length}
                    busy={busy}
                    onEdit={openEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onMove={handleMove}
                  />
                ))}
              </Box>
            )}
          </>
        ))}

      {/* ── SECTION SETTINGS ──────────────────────────────────────────────── */}
      {tab === 1 &&
        (loading ? (
          renderSkeleton()
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
                These apply to the hero as a whole. Anything a single slide overrides wins over them.
              </Typography>
              <Button
                variant="contained"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                startIcon={
                  savingConfig ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Icon icon="mdi:content-save" />
                  )
                }
              >
                {savingConfig ? "Saving..." : "Save Changes"}
              </Button>
            </Box>

            <Grid container spacing={3}>
              {/* Visibility + playback */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    {sectionHeader(
                      "mdi:play-circle-outline",
                      "Visibility & playback",
                      "Whether the hero shows at all, and how it moves between slides."
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.enabled}
                          onChange={(e) => setCfg({ enabled: e.target.checked })}
                        />
                      }
                      label="Show the hero section on the storefront"
                    />
                    <FormControlLabel
                      sx={{ display: "flex" }}
                      control={
                        <Switch
                          checked={config.autoplay}
                          onChange={(e) => setCfg({ autoplay: e.target.checked })}
                        />
                      }
                      label="Advance slides automatically"
                    />
                    <FormControlLabel
                      sx={{ display: "flex", mb: 2 }}
                      control={
                        <Switch
                          checked={config.pauseOnHover}
                          disabled={!config.autoplay}
                          onChange={(e) => setCfg({ pauseOnHover: e.target.checked })}
                        />
                      }
                      label="Pause while the pointer is over the hero"
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Slide duration"
                          value={msToSeconds(config.intervalMs)}
                          disabled={!config.autoplay}
                          onChange={(e) => setCfg({ intervalMs: secondsToMs(e.target.value) })}
                          onBlur={() =>
                            setCfg({
                              intervalMs: clampInt(
                                config.intervalMs,
                                HERO_MIN_DURATION_MS,
                                HERO_MAX_DURATION_MS,
                                DEFAULT_HERO_CONFIG.intervalMs
                              ),
                            })
                          }
                          InputProps={{
                            endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                          }}
                          inputProps={{ min: 1, max: 60, step: 0.5 }}
                          helperText="The default; a slide can set its own"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Transition"
                          value={config.transition}
                          onChange={(e) => setCfg({ transition: e.target.value })}
                          helperText={
                            HERO_TRANSITIONS.find((t) => t.value === config.transition)?.hint
                          }
                        >
                          {HERO_TRANSITIONS.map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                              {t.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                    <Alert severity="info" icon={<Icon icon="mdi:human-cane" />} sx={{ mt: 2 }}>
                      Shoppers who ask their device for reduced motion always get a still first
                      slide, whatever is set here.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>

              {/* Chrome */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    {sectionHeader(
                      "mdi:gesture-tap-button",
                      "Controls & overlay",
                      "The furniture drawn on top of the slides."
                    )}
                    {[
                      {
                        key: "showControls",
                        label: "Slide selector hairlines",
                        hint: "The row of rules that jumps between slides",
                      },
                      {
                        key: "showCounter",
                        label: "Slide counter",
                        hint: "The 01 — 04 marker beside the hairlines",
                      },
                      {
                        key: "showProgress",
                        label: "Autoplay progress bar",
                        hint: "A gold hairline that fills over the slide duration",
                      },
                      {
                        key: "showArrows",
                        label: "Previous / next arrows",
                        hint: "Extra arrow buttons at the stage edges",
                      },
                    ].map((row) => (
                      <FormControlLabel
                        key={row.key}
                        sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}
                        control={
                          <Switch
                            checked={config[row.key]}
                            disabled={row.key === "showCounter" && !config.showControls}
                            onChange={(e) => setCfg({ [row.key]: e.target.checked })}
                          />
                        }
                        label={
                          <Box sx={{ pt: 0.75 }}>
                            <Typography variant="body2">{row.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.hint}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Overlay darkness — {config.overlayOpacity}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        How heavily the ink wash sits over the media so the headline stays legible.
                      </Typography>
                      <Slider
                        value={config.overlayOpacity}
                        min={0}
                        max={100}
                        step={5}
                        marks={[
                          { value: 0, label: "None" },
                          { value: 100, label: "Full" },
                        ]}
                        valueLabelDisplay="auto"
                        onChange={(e, v) => setCfg({ overlayOpacity: v })}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Stage height per device */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    {sectionHeader(
                      "mdi:arrow-expand-vertical",
                      "Stage height",
                      "Set independently for each device. The stage takes the viewport-height value, held between the minimum and maximum — so it scales with the screen without ever collapsing or running past the fold."
                    )}
                    <Grid container spacing={3}>
                      {HERO_DEVICES.map((device) => (
                        <Grid item xs={12} md={4} key={device.key}>
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, height: "100%", bgcolor: (t) => alpha(t.palette.primary.main, 0.03) }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                              <Icon icon={device.icon} style={{ fontSize: 20 }} />
                              <Typography variant="subtitle2" fontWeight={700}>
                                {device.label}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {device.hint}
                            </Typography>
                            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label="Min"
                                  value={config.heights[device.key].min}
                                  onChange={(e) => setHeight(device.key, "min", e.target.value)}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                                  }}
                                  inputProps={{ min: 200, max: 1200 }}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label="Height"
                                  value={config.heights[device.key].vh}
                                  onChange={(e) => setHeight(device.key, "vh", e.target.value)}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">vh</InputAdornment>,
                                  }}
                                  inputProps={{ min: 20, max: 100 }}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label="Max"
                                  value={config.heights[device.key].max}
                                  onChange={(e) => setHeight(device.key, "max", e.target.value)}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                                  }}
                                  inputProps={{ min: 200, max: 1600 }}
                                />
                              </Grid>
                            </Grid>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 1.5, fontFamily: "monospace" }}
                            >
                              clamp({config.heights[device.key].min}px,{" "}
                              {config.heights[device.key].vh}vh, {config.heights[device.key].max}px)
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Shared secondary CTA */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    {sectionHeader(
                      "mdi:link-variant",
                      "Shared secondary button",
                      "The hairline button beside each slide's gold one. A slide can override it."
                    )}
                    <FormControlLabel
                      sx={{ mb: 2 }}
                      control={
                        <Switch
                          checked={config.secondaryCta.enabled}
                          onChange={(e) => setNested("secondaryCta", { enabled: e.target.checked })}
                        />
                      }
                      label="Show the secondary button"
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Label"
                          value={config.secondaryCta.label}
                          disabled={!config.secondaryCta.enabled}
                          onChange={(e) => setNested("secondaryCta", { label: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Link"
                          value={config.secondaryCta.link}
                          disabled={!config.secondaryCta.enabled}
                          onChange={(e) => setNested("secondaryCta", { link: e.target.value })}
                          helperText="A storefront path, e.g. /about"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Openers */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    {sectionHeader(
                      "mdi:format-list-bulleted",
                      "Collection index row",
                      "The hairline row of collection links under the stage. The links themselves are your live top-level categories, in their sort order."
                    )}
                    <FormControlLabel
                      sx={{ mb: 2 }}
                      control={
                        <Switch
                          checked={config.openers.enabled}
                          onChange={(e) => setNested("openers", { enabled: e.target.checked })}
                        />
                      }
                      label="Show the collection index row"
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={7}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Row label"
                          value={config.openers.label}
                          disabled={!config.openers.enabled}
                          onChange={(e) => setNested("openers", { label: e.target.value })}
                          helperText="Hidden on phones to save the width"
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="How many"
                          value={config.openers.limit}
                          disabled={!config.openers.enabled}
                          onChange={(e) => setNested("openers", { limit: e.target.value })}
                          inputProps={{ min: 1, max: 20 }}
                          helperText="Max collections shown"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        ))}

      {/* ── SLIDE EDITOR ──────────────────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !savingSlide && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={fullScreenDialog}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {editing ? "Edit slide" : "New slide"}
        </DialogTitle>
        <DialogContent dividers>
          {/* Live preview — same normalizers as the storefront. */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Preview
            </Typography>
            <SlidePreview slide={normalizeHeroSlide(form)} config={config} />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              A miniature of the real stage. On the storefront the type is far larger and the stage
              is {config.heights.desktop.vh}vh tall on desktop.
            </Typography>
          </Box>

          {/* Copy */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Copy
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Eyebrow"
                value={form.eyebrow}
                onChange={(e) => setField("eyebrow", e.target.value)}
                helperText="Leave blank to use the linked collection's name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                required
                label="Headline"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                helperText="Reads best up to about 18 characters a line"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Supporting line"
                value={form.subtitle}
                onChange={(e) => setField("subtitle", e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Button label"
                value={form.cta}
                onChange={(e) => setField("cta", e.target.value)}
                helperText="Blank hides the gold button"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Button link"
                value={form.link}
                onChange={(e) => setField("link", e.target.value)}
                helperText="e.g. /products?category=mekhela-chador"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Secondary button label"
                value={form.secondaryCtaLabel}
                onChange={(e) => setField("secondaryCtaLabel", e.target.value)}
                helperText={`Blank uses the shared "${config.secondaryCta.label}"`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Secondary button link"
                value={form.secondaryCtaLink}
                onChange={(e) => setField("secondaryCtaLink", e.target.value)}
                helperText={`Blank uses the shared ${config.secondaryCta.link}`}
              />
            </Grid>
          </Grid>

          {/* Background */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Background
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={form.backgroundType}
            onChange={(e, v) => v && setField("backgroundType", v)}
            sx={{ mb: 2, flexWrap: "wrap" }}
          >
            {HERO_BACKGROUND_TYPES.map((t) => (
              <ToggleButton key={t.value} value={t.value} sx={{ textTransform: "none", gap: 0.75 }}>
                <Icon icon={t.icon} /> {t.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {form.backgroundType === "image" && (
              <>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Image URL"
                    value={form.image}
                    onChange={(e) => setField("image", e.target.value)}
                    helperText="Landscape, at least 1600×900. Served as-is — use your CDN URL."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Focal point"
                    value={form.imagePosition}
                    onChange={(e) => setField("imagePosition", e.target.value)}
                    helperText="Kept in frame when cropped"
                  >
                    {HERO_IMAGE_POSITIONS.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}

            {form.backgroundType === "video" && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Video URL"
                    value={form.videoUrl}
                    onChange={(e) => setField("videoUrl", e.target.value)}
                    helperText="A direct .mp4 or .webm file — not a YouTube page link"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Poster image URL"
                    value={form.videoPoster}
                    onChange={(e) => setField("videoPoster", e.target.value)}
                    helperText="Shown while the video loads, and instead of it under reduced motion"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Focal point"
                    value={form.imagePosition}
                    onChange={(e) => setField("imagePosition", e.target.value)}
                  >
                    {HERO_IMAGE_POSITIONS.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Alert severity="info" icon={<Icon icon="mdi:volume-off" />} sx={{ height: "100%" }}>
                    Background video always plays muted, looped and inline — the only way browsers
                    allow autoplay. Keep the file short and small.
                  </Alert>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Gradient"
                value={form.gradient}
                onChange={(e) => setField("gradient", e.target.value)}
                helperText={
                  form.backgroundType === "gradient"
                    ? "Any CSS background value"
                    : "Sits behind the media — it shows while that loads and around any letterboxing"
                }
              />
              <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                {GRADIENT_PRESETS.map((preset) => (
                  <Tooltip key={preset.label} title={preset.label}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setField("gradient", preset.value)}
                      aria-label={`Use the ${preset.label} gradient`}
                      sx={{
                        width: 56,
                        height: 32,
                        p: 0,
                        cursor: "pointer",
                        borderRadius: 1,
                        border: "2px solid",
                        borderColor: form.gradient === preset.value ? "primary.main" : "divider",
                      }}
                      style={{ background: preset.value }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Grid>
          </Grid>

          {/* Layout & timing */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Layout &amp; timing
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Copy alignment
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={form.textAlign}
                onChange={(e, v) => v && setField("textAlign", v)}
              >
                {HERO_TEXT_ALIGNMENTS.map((a) => (
                  <ToggleButton key={a.value} value={a.value} sx={{ textTransform: "none", gap: 0.5 }}>
                    <Icon icon={a.icon} /> {a.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                The ink wash follows the copy, so it stays legible whichever side it sits on.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.durationMs > 0}
                    onChange={(e) =>
                      setField("durationMs", e.target.checked ? config.intervalMs : 0)
                    }
                  />
                }
                label={
                  <Typography variant="body2">
                    Give this slide its own time on screen
                  </Typography>
                }
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Time on screen"
                value={form.durationMs > 0 ? msToSeconds(form.durationMs) : msToSeconds(config.intervalMs)}
                disabled={!form.durationMs}
                onChange={(e) => setField("durationMs", secondsToMs(e.target.value))}
                onBlur={() =>
                  form.durationMs &&
                  setField(
                    "durationMs",
                    clampInt(form.durationMs, HERO_MIN_DURATION_MS, HERO_MAX_DURATION_MS, config.intervalMs)
                  )
                }
                InputProps={{ endAdornment: <InputAdornment position="end">sec</InputAdornment> }}
                inputProps={{ min: 1, max: 60, step: 0.5 }}
                helperText={
                  form.durationMs
                    ? "Between 1 and 60 seconds"
                    : `Following the section default of ${msToSeconds(config.intervalMs)}s`
                }
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.overlayOpacity !== null}
                    onChange={(e) =>
                      setField("overlayOpacity", e.target.checked ? config.overlayOpacity : null)
                    }
                  />
                }
                label={<Typography variant="body2">Override the overlay darkness</Typography>}
              />
              <Box sx={{ px: 1 }}>
                <Slider
                  value={form.overlayOpacity ?? config.overlayOpacity}
                  min={0}
                  max={100}
                  step={5}
                  disabled={form.overlayOpacity === null}
                  valueLabelDisplay="auto"
                  onChange={(e, v) => setField("overlayOpacity", v)}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {form.overlayOpacity === null
                  ? `Following the section setting of ${config.overlayOpacity}%`
                  : `${form.overlayOpacity}% — raise it if the headline is hard to read on this image`}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setField("isActive", e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {form.isActive ? "Live on the storefront" : "Hidden from the storefront"}
                  </Typography>
                }
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Position"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", e.target.value)}
                helperText="Lower shows first — or reorder with the arrows in the list"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={savingSlide}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSlide}
            disabled={savingSlide}
            startIcon={
              savingSlide ? <CircularProgress size={18} color="inherit" /> : <Icon icon="mdi:content-save" />
            }
          >
            {savingSlide ? "Saving..." : editing ? "Save slide" : "Add slide"}
          </Button>
        </DialogActions>
      </Dialog>

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

export default AdminHeroSection;
