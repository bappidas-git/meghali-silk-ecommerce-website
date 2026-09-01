import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Autocomplete,
  Alert,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import apiService from "../../services/api";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import { notifyFaqsUpdated } from "../../context/FaqContext";
import {
  DEFAULT_FAQ,
  FAQ_COPY_TOKENS,
  FAQ_PLACEMENTS,
  faqIsTargeted,
  faqPlacementMeta,
  normalizeFaq,
  normalizeFaqs,
} from "../../utils/faqs";

// =============================================================================
// Admin → Storefront → FAQs
// =============================================================================
// One screen for every answered question on the storefront. A single `faqs`
// collection backs three surfaces, and each row says which of them it belongs
// on:
//
//   PRODUCT PAGES  the "FAQs" tab on the product page — the accordion beside
//                  Description / Specifications / Reviews
//   HELP CENTRE    the searchable list at /help
//   SHARED BLOCK   the reusable Frequently Asked Questions section
//
// A row can also be aimed at particular products, in which case it is read only
// on those product pages — above the general answers, so the specific reply to
// "does this Mekhela arrive stitched?" sits ahead of the store-wide one.
//
// The order here is the order a shopper reads, top first. Answers may quote the
// store's own figures with {freeShipping} / {codSentence} / {taxNote}; those
// fill from Settings > General when the page renders, and the editor previews
// them filled, so what an admin sees is what ships.
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

const FILTERS = [
  { value: "all", label: "All", icon: "mdi:format-list-bulleted" },
  { value: "live", label: "Live", icon: "mdi:eye-outline" },
  { value: "hidden", label: "Hidden", icon: "mdi:eye-off-outline" },
  { value: "targeted", label: "Product-specific", icon: "mdi:package-variant-closed" },
];

// ─── One answer in the list ──────────────────────────────────────────────────
const FaqRow = ({
  faq,
  position,
  total,
  busy,
  canReorder,
  productNames,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
  onMove,
}) => {
  const targeted = faqIsTargeted(faq);
  const label = faq.question || "Untitled question";

  return (
    <Card
      sx={{
        opacity: faq.isActive ? 1 : 0.62,
        borderLeft: "3px solid",
        borderLeftColor: faq.isActive ? "success.main" : "divider",
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
          {/* Order controls. Reordering is offered only on the full, unfiltered
              list — moving a row "up" inside a search result would write an
              order the admin cannot see. */}
          <Grid item xs="auto">
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <IconButton
                size="small"
                disabled={!canReorder || position <= 0 || busy}
                onClick={() => onMove(position, -1)}
                aria-label={`Move up: ${label}`}
              >
                <Icon icon="mdi:chevron-up" />
              </IconButton>
              {/* The row's true place in the storefront order, not its place in
                  a filtered view — so a search can never imply a new order. */}
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {String(position + 1).padStart(2, "0")}
              </Typography>
              <IconButton
                size="small"
                disabled={!canReorder || position === total - 1 || busy}
                onClick={() => onMove(position, 1)}
                aria-label={`Move down: ${label}`}
              >
                <Icon icon="mdi:chevron-down" />
              </IconButton>
            </Box>
          </Grid>

          {/* The question, a taste of the answer, and where it is read */}
          <Grid item xs md>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
              {label}
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
              {faq.answer || "No answer written yet"}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {faq.placements.length === 0 ? (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  icon={<Icon icon="mdi:alert-outline" />}
                  label="Read nowhere"
                />
              ) : (
                faq.placements.map((value) => {
                  const meta = faqPlacementMeta(value);
                  return meta ? (
                    <Chip
                      key={value}
                      size="small"
                      icon={<Icon icon={meta.icon} />}
                      label={meta.short}
                    />
                  ) : null;
                })
              )}
              <Chip
                size="small"
                variant={targeted ? "filled" : "outlined"}
                color={targeted ? "primary" : "default"}
                icon={<Icon icon={targeted ? "mdi:tag-outline" : "mdi:earth"} />}
                label={
                  targeted
                    ? productNames.length === 1
                      ? productNames[0]
                      : `${faq.productIds.length} products`
                    : "All products"
                }
                sx={{ maxWidth: { xs: 210, sm: 300 } }}
              />
            </Box>
          </Grid>

          {/* Row actions — their own line on a phone, right-aligned on desktop */}
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
                    checked={faq.isActive}
                    disabled={busy}
                    onChange={() => onToggleActive(faq)}
                  />
                }
                label={
                  <Typography variant="caption">{faq.isActive ? "Live" : "Hidden"}</Typography>
                }
              />
              <Tooltip title="Edit answer">
                <span>
                  {/* The Tooltip wraps a <span> so it still shows on a disabled
                      button, which means it cannot label the button itself —
                      each one carries its own aria-label. */}
                  <IconButton
                    size="small"
                    aria-label={`Edit: ${label}`}
                    onClick={() => onEdit(faq)}
                    disabled={busy}
                  >
                    <Icon icon="mdi:pencil-outline" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Duplicate answer">
                <span>
                  <IconButton
                    size="small"
                    aria-label={`Duplicate: ${label}`}
                    onClick={() => onDuplicate(faq)}
                    disabled={busy}
                  >
                    <Icon icon="mdi:content-copy" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Delete answer">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Delete: ${label}`}
                    onClick={() => onDelete(faq)}
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
const AdminFaqs = () => {
  // A phone gets the editor as a full screen rather than a cramped card.
  const fullScreenDialog = useMediaQuery("(max-width:599.95px)");
  // The answers quote thresholds the admin owns; the preview fills them exactly
  // as the storefront will.
  const { fillCopy } = useStoreSettings();

  const [faqs, setFaqs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FAQ);
  const answerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [rows, catalogue] = await Promise.all([
        apiService.admin.getFaqs().catch(() => []),
        // Targeting is a convenience, not a requirement — a catalogue that
        // fails to load leaves the rest of the screen working.
        apiService.admin.getProducts().catch(() => []),
      ]);
      setFaqs(normalizeFaqs(rows));
      setProducts(Array.isArray(catalogue) ? catalogue : []);
    } catch (error) {
      console.error("Error loading FAQs:", error);
      toast("error", "Could not load the FAQs", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(String(p.id), p));
    return map;
  }, [products]);

  const namesFor = useCallback(
    (faq) =>
      (faq.productIds || []).map(
        (id) => productById.get(String(id))?.name || `Product #${id}`
      ),
    [productById]
  );

  const stats = useMemo(() => {
    const live = faqs.filter((f) => f.isActive);
    return {
      total: faqs.length,
      live: live.length,
      onProduct: live.filter((f) => f.placements.includes("product")).length,
      targeted: faqs.filter(faqIsTargeted).length,
    };
  }, [faqs]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return faqs.filter((faq) => {
      if (filter === "live" && !faq.isActive) return false;
      if (filter === "hidden" && faq.isActive) return false;
      if (filter === "targeted" && !faqIsTargeted(faq)) return false;
      if (!term) return true;
      return (
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        namesFor(faq).some((name) => name.toLowerCase().includes(term))
      );
    });
  }, [faqs, filter, search, namesFor]);

  // Moving a row rewrites the whole collection's order, so it is only offered
  // when the whole collection is on screen.
  const canReorder = filter === "all" && !search.trim();

  // ── Editing ────────────────────────────────────────────────────────────────
  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const openCreate = () => {
    const maxSort = faqs.reduce((m, f) => Math.max(m, f.sortOrder ?? 0), -1);
    setEditing(null);
    setForm({ ...DEFAULT_FAQ, sortOrder: maxSort + 1 });
    setDialogOpen(true);
  };

  const openEdit = (faq) => {
    setEditing(faq);
    setForm({ ...DEFAULT_FAQ, ...faq });
    setDialogOpen(true);
  };

  // Strip the identity fields so a saved answer only ever carries FAQ data —
  // ids are the store's to assign, `updatedAt` the API layer's to stamp. A row
  // that already has a `createdAt` keeps it, because json-server's PUT replaces
  // the whole record and would otherwise drop the date it was written.
  const faqPayload = (faq) => {
    const { id, updatedAt, ...rest } = normalizeFaq(faq);
    return rest;
  };

  // Put a token in at the cursor, so it can be dropped mid-sentence rather than
  // only at the end of the answer.
  const insertToken = (token) => {
    const input = answerRef.current;
    const value = form.answer || "";
    if (!input || typeof input.selectionStart !== "number") {
      setField("answer", value ? `${value} ${token}` : token);
      return;
    }
    const { selectionStart: start, selectionEnd: end } = input;
    setField("answer", `${value.slice(0, start)}${token}${value.slice(end)}`);
    // Put the caret back after React has written the new value into the field.
    requestAnimationFrame(() => {
      input.focus();
      const caret = start + token.length;
      input.setSelectionRange(caret, caret);
    });
  };

  const togglePlacement = (value) =>
    setForm((f) => ({
      ...f,
      placements: f.placements.includes(value)
        ? f.placements.filter((p) => p !== value)
        : [...f.placements, value],
    }));

  const handleSave = async () => {
    if (!form.question.trim()) {
      toast("warning", "A question is required");
      return;
    }
    if (!form.answer.trim()) {
      toast("warning", "An answer is required");
      return;
    }
    if (form.placements.length === 0) {
      toast("warning", "Choose where this answer is read", "Pick at least one surface.");
      return;
    }
    try {
      setSaving(true);
      const payload = faqPayload(form);
      if (editing) {
        await apiService.admin.updateFaq(editing.id, payload);
      } else {
        await apiService.admin.createFaq(payload);
      }
      setDialogOpen(false);
      await load();
      notifyFaqsUpdated();
      toast("success", editing ? "Answer updated" : "Answer added");
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast("error", "Could not save the answer", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (faq) => {
    try {
      setBusy(true);
      const maxSort = faqs.reduce((m, f) => Math.max(m, f.sortOrder ?? 0), -1);
      await apiService.admin.createFaq(
        faqPayload({
          ...faq,
          question: `${faq.question} (copy)`,
          // A duplicate arrives hidden, so it can be edited before it is read.
          isActive: false,
          sortOrder: maxSort + 1,
        })
      );
      await load();
      notifyFaqsUpdated();
      toast("success", "Answer duplicated", "The copy is hidden until you switch it on.");
    } catch (error) {
      console.error("Error duplicating FAQ:", error);
      toast("error", "Could not duplicate the answer", error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (faq) => {
    // The storefront falls back to its built-in answers when the collection is
    // empty, so an admin should know before they clear the last one.
    const lastOne = faqs.length === 1;
    const result = await Swal.fire({
      title: "Delete this answer?",
      html: `<strong>${faq.question || "Untitled question"}</strong> will be permanently removed.${
        lastOne
          ? "<br/><br/>It is the last one — the storefront will fall back to its built-in answers until you add another."
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
      await apiService.admin.deleteFaq(faq.id);
      await load();
      notifyFaqsUpdated();
      toast("success", "Answer deleted");
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast("error", "Could not delete the answer", error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (faq) => {
    const isActive = !faq.isActive;
    // Optimistic — the switch has to answer immediately.
    setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, isActive } : f)));
    try {
      setBusy(true);
      await apiService.admin.updateFaq(faq.id, faqPayload({ ...faq, isActive }));
      notifyFaqsUpdated();
    } catch (error) {
      console.error("Error toggling FAQ:", error);
      toast("error", "Could not update the answer", error.message);
      load(); // roll back to server truth
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (position, direction) => {
    const target = position + direction;
    if (position < 0 || target < 0 || target >= faqs.length) return;
    const next = [...faqs];
    [next[position], next[target]] = [next[target], next[position]];
    // Renumber from the top so the order is dense and stable.
    const renumbered = next.map((f, i) => ({ ...f, sortOrder: i }));
    setFaqs(renumbered);
    try {
      setBusy(true);
      await apiService.admin.reorderFaqs(
        renumbered.map((f) => f.id),
        faqs
      );
      notifyFaqsUpdated();
    } catch (error) {
      console.error("Error reordering FAQs:", error);
      toast("error", "Could not save the new order", error.message);
      load();
    } finally {
      setBusy(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const selectedProducts = useMemo(
    () => (form.productIds || []).map((id) => productById.get(String(id))).filter(Boolean),
    [form.productIds, productById]
  );

  // An answer aimed at products but switched off for product pages would never
  // be read — say so in the editor rather than saving a row into silence.
  const targetingIgnored =
    (form.productIds || []).length > 0 && !form.placements.includes("product");

  const statTiles = [
    { label: "Answers", value: stats.total, icon: "mdi:comment-question-outline", color: "#6366f1" },
    { label: "Live", value: stats.live, icon: "mdi:eye-outline", color: "#16a34a" },
    {
      label: "On product pages",
      value: stats.onProduct,
      icon: "mdi:package-variant-closed",
      color: "#0891b2",
    },
    { label: "Product-specific", value: stats.targeted, icon: "mdi:tag-outline", color: "#d97706" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Heading ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            FAQs
          </Typography>
          <Typography color="text.secondary">
            The questions answered on the storefront — the FAQs tab of a product page, the Help
            Centre and the shared FAQ block. Read in this order, top first.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={openCreate}
          disabled={busy}
          sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          Add FAQ
        </Button>
      </Box>

      {/* ── What is live ────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statTiles.map((tile) => (
          <Grid item xs={6} md={3} key={tile.label}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(tile.color, 0.12),
                  color: tile.color,
                }}
              >
                <Icon icon={tile.icon} style={{ fontSize: 22 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  {loading ? "—" : tile.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {tile.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {!loading && stats.total > 0 && stats.live === 0 && (
        <Alert severity="warning" icon={<Icon icon="mdi:eye-off-outline" />} sx={{ mb: 3 }}>
          Every answer is hidden — the storefront is falling back to its built-in FAQ set.
        </Alert>
      )}

      {/* ── Search & filter ─────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
          alignItems: { xs: "stretch", md: "center" },
        }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Search questions, answers or products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: { md: 420 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")} aria-label="Clear the search">
                  <Icon icon="mdi:close" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        {/* The filter row scrolls sideways on a narrow phone rather than
            wrapping into a second, half-empty line of buttons. */}
        <Box sx={{ overflowX: "auto", ml: { md: "auto" }, pb: { xs: 0.5, md: 0 } }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(e, value) => value && setFilter(value)}
            sx={{ flexWrap: "nowrap" }}
          >
            {FILTERS.map((option) => (
              <ToggleButton
                key={option.value}
                value={option.value}
                sx={{ whiteSpace: "nowrap", gap: 0.5 }}
              >
                <Icon icon={option.icon} />
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* ── The answers ─────────────────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={140} />
          ))}
        </Box>
      ) : faqs.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Icon icon="mdi:comment-question-outline" style={{ fontSize: 48, opacity: 0.4 }} />
          <Typography variant="h6" sx={{ mt: 1 }}>
            No answers yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The storefront is showing its built-in FAQ set. Add one to take it over.
          </Typography>
          <Button variant="contained" startIcon={<Icon icon="mdi:plus" />} onClick={openCreate}>
            Add the first answer
          </Button>
        </Paper>
      ) : visible.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Icon icon="mdi:magnify-close" style={{ fontSize: 44, opacity: 0.4 }} />
          <Typography variant="h6" sx={{ mt: 1 }}>
            Nothing matches
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            No answer matches this search and filter.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Clear the search
          </Button>
        </Paper>
      ) : (
        <>
          {!canReorder && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Showing {visible.length} of {faqs.length}. Clear the search and filter to reorder.
            </Typography>
          )}
          <Box sx={{ display: "grid", gap: 2 }}>
            {visible.map((faq) => (
              <FaqRow
                key={faq.id}
                faq={faq}
                position={faqs.findIndex((f) => f.id === faq.id)}
                total={faqs.length}
                busy={busy}
                canReorder={canReorder}
                productNames={namesFor(faq)}
                onEdit={openEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onMove={handleMove}
              />
            ))}
          </Box>
        </>
      )}

      {/* ── Editor ──────────────────────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={fullScreenDialog}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {editing ? "Edit answer" : "New answer"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ pt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Question *"
                value={form.question}
                onChange={(e) => setField("question", e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. Does a Mekhela Chador arrive stitched?"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Answer *"
                value={form.answer}
                onChange={(e) => setField("answer", e.target.value)}
                inputRef={answerRef}
                fullWidth
                size="small"
                multiline
                minRows={5}
                placeholder="Answer in full — a shopper who reads this should not need to write in."
              />
              <Box
                sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 1, alignItems: "center" }}
              >
                <Typography variant="caption" color="text.secondary">
                  Insert a figure from Settings:
                </Typography>
                {FAQ_COPY_TOKENS.map((token) => (
                  <Tooltip key={token.token} title={token.hint}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={token.token}
                      onClick={() => insertToken(token.token)}
                      sx={{ fontFamily: "monospace" }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Grid>

            {/* What the shopper actually reads, tokens filled */}
            {form.answer.trim() !== "" && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: (theme) => alpha(theme.palette.text.primary, 0.03),
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mb: 1,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    As it reads on the page
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="primary"
                      fontWeight={700}
                      sx={{ pt: 0.25 }}
                    >
                      {String(
                        (editing ? faqs.findIndex((f) => f.id === editing.id) : faqs.length) + 1
                      ).padStart(2, "0")}
                    </Typography>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                        {form.question || "Untitled question"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {fillCopy(form.answer)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Where it is read */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Where it is read
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Pick every surface this answer belongs on.
              </Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {FAQ_PLACEMENTS.map((placement) => {
                  const checked = form.placements.includes(placement.value);
                  return (
                    <Paper
                      key={placement.value}
                      elevation={0}
                      onClick={() => togglePlacement(placement.value)}
                      sx={{
                        p: 1.25,
                        border: "1px solid",
                        borderColor: checked ? "primary.main" : "divider",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Icon icon={placement.icon} style={{ fontSize: 22, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {placement.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {placement.hint}
                        </Typography>
                      </Box>
                      <Switch
                        size="small"
                        checked={checked}
                        onChange={() => togglePlacement(placement.value)}
                        onClick={(e) => e.stopPropagation()}
                        inputProps={{ "aria-label": placement.label }}
                      />
                    </Paper>
                  );
                })}
              </Box>
            </Grid>

            {/* Which products it belongs to */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Which products
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Leave this empty and the answer is read on every product page. Name products and it
                is read only on those, above the general answers.
              </Typography>
              <Autocomplete
                multiple
                size="small"
                options={products}
                value={selectedProducts}
                onChange={(e, value) => setField("productIds", value.map((p) => p.id))}
                getOptionLabel={(option) => option.name || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Products"
                    placeholder={selectedProducts.length ? "" : "Every product"}
                  />
                )}
                noOptionsText="No products found"
              />
              {targetingIgnored && (
                <Alert severity="warning" sx={{ mt: 1.5 }} icon={<Icon icon="mdi:alert-outline" />}>
                  This answer names products but is switched off for product pages, so nobody will
                  read it there.
                </Alert>
              )}
              <FormControlLabel
                sx={{ mt: 2 }}
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setField("isActive", e.target.checked)}
                  />
                }
                label={form.isActive ? "Live on the storefront" : "Hidden"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {editing ? "Save changes" : "Add answer"}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default AdminFaqs;
