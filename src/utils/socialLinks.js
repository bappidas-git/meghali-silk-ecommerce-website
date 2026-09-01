// =============================================================================
// Social links — platforms, normalisation and the render-ready list
// =============================================================================
// The five marks under the footer wordmark (and the "Follow our journey" card
// on Contact) used to be frozen into SOCIAL_LINKS in constants.js, so changing
// where they point meant a code change and a redeploy. They now come from the
// `settings.social` section of the settings record — the same record that owns
// the store name, contact block and currency — and are edited from the admin's
// Settings > Social Links tab.
//
// Two rules the storefront has always followed and this file preserves:
//
//   blank = hidden   An entry with no URL renders no icon, rather than a dead
//                    link. Clearing a field in the admin IS the way to remove a
//                    mark, so a blank value is never fallen back on.
//   missing = seed   A settings record with no `social` section at all (an old
//                    record, or an unreachable API) falls back to the built-in
//                    defaults, so the close of the page still looks like it did
//                    yesterday instead of losing its row.
//
// Adding a sixth platform is one entry in SOCIAL_PLATFORMS below plus a matching
// key in `settings.social`: the footer row, the Contact card and the admin form
// are all generated from this list and pick it up with no further edits.
// =============================================================================
import { SOCIAL_LINKS } from "./constants";

// The canonical set, in the order they are read on every surface.
//
//   key         the field name in `settings.social` (matches the API contract:
//               section ∈ store|shipping|payment|notifications|seo|social)
//   label       accessible name on the storefront, field label in the admin
//   adminIcon   Iconify id — the admin panel is MUI/Iconify furniture
//   glyph       name in Contact's hairline stroke set (see Support.js)
//   path        24x24 solid brand path — the footer's own drawing language
//   placeholder the shape of a correct value, shown in the empty admin field
export const SOCIAL_PLATFORMS = [
  {
    key: "facebook",
    label: "Facebook",
    adminIcon: "mdi:facebook",
    glyph: "facebook",
    placeholder: "https://facebook.com/yourpage",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    key: "instagram",
    label: "Instagram",
    adminIcon: "mdi:instagram",
    glyph: "instagram",
    placeholder: "https://instagram.com/yourhandle",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    key: "youtube",
    label: "YouTube",
    adminIcon: "mdi:youtube",
    glyph: "youtube",
    placeholder: "https://youtube.com/@yourchannel",
    path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    // The field is still `twitter` — that is the key the API contract and the
    // seed record use, and renaming it would orphan every store already saved.
    // Only what the visitor reads was updated to the current mark.
    key: "twitter",
    label: "X",
    adminIcon: "mdi:twitter",
    glyph: "twitter",
    placeholder: "https://x.com/yourhandle",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    adminIcon: "mdi:whatsapp",
    glyph: "whatsapp",
    // A bare number is accepted too and turned into a wa.me link — see below.
    placeholder: "https://wa.me/919876543210 or 919876543210",
    path: "M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 01-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.19 8.19 0 01-1.26-4.37c0-4.54 3.69-8.25 8.25-8.25zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.53.07-.25-.13-1.06-.39-2.02-1.24-.75-.66-1.25-1.48-1.4-1.73-.14-.24-.01-.37.11-.5.11-.11.25-.29.37-.44.11-.15.15-.25.23-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.55-.42h-.47z",
  },
];

export const SOCIAL_PLATFORM_KEYS = SOCIAL_PLATFORMS.map((p) => p.key);

export const getSocialPlatform = (key) =>
  SOCIAL_PLATFORMS.find((p) => p.key === key) || null;

// The values the site shipped with, keyed the way `settings.social` keys them.
// Used only when a settings record has no `social` section at all.
export const DEFAULT_SOCIAL_LINKS = {
  facebook: SOCIAL_LINKS.FACEBOOK,
  instagram: SOCIAL_LINKS.INSTAGRAM,
  youtube: SOCIAL_LINKS.YOUTUBE,
  twitter: SOCIAL_LINKS.TWITTER,
  whatsapp: SOCIAL_LINKS.WHATSAPP,
};

// An admin typing into a plain text field will not always type a URL. Rather
// than publish a link the browser resolves against our own origin
// (`instagram.com/x` would navigate to /products/instagram.com/x), the value is
// repaired here — once, on the way out of the record, so every surface renders
// the same href.
const PHONE_ONLY = /^\+?[\d\s\-().]{6,}$/;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export const normalizeSocialUrl = (value, key) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  // WhatsApp is the one platform whose natural value is a phone number. Accept
  // "+91 98765 43210" and publish the wa.me link the storefront needs.
  if (key === "whatsapp" && !HAS_SCHEME.test(raw) && PHONE_ONLY.test(raw)) {
    const digits = raw.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }

  // Protocol-relative ("//instagram.com/x") — keep the host, pick a scheme.
  if (raw.startsWith("//")) return `https:${raw}`;
  // mailto:, tel: and http(s): are all left exactly as typed.
  if (HAS_SCHEME.test(raw)) return raw;
  // Anything else is a bare host/path: make it absolute so it leaves the site.
  return `https://${raw.replace(/^\/+/, "")}`;
};

// The `settings.social` map, repaired. Always returns every known key, so the
// admin form and the storefront both read a complete, predictable object.
//
// `raw` missing entirely → the seed values. `raw` present with a blank field →
// that field stays blank, because clearing it is how a mark is removed.
export const normalizeSocialLinks = (raw) => {
  const source = raw && typeof raw === "object" ? raw : DEFAULT_SOCIAL_LINKS;
  const out = {};
  SOCIAL_PLATFORMS.forEach(({ key }) => {
    out[key] = normalizeSocialUrl(source[key], key);
  });
  return out;
};

// The render-ready list: the platforms that actually have a URL, in canonical
// order, each carrying the art and the label its surface needs. Both the footer
// row and the Contact card map straight over this.
export const activeSocialLinks = (links) => {
  const map = links || {};
  return SOCIAL_PLATFORMS.filter((p) => !!map[p.key]).map((p) => ({
    key: p.key,
    label: p.label,
    glyph: p.glyph,
    path: p.path,
    url: map[p.key],
  }));
};
