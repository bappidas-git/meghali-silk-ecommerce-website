# Wishlist — the Private Collection

**Prompt 17 of 30**

## Depends on

Prompt 09 (ProductCard + RelatedProducts), Prompt 11 (AuthModal entry), Prompts 01/02/03.

## Context

Meghali's Silk — Assamese-silk boutique storefront, redesigned as warm-minimalist editorial luxury DTC (light, golden-logo `--sf-*` tokens). `/wishlist` (`src/pages/Wishlist/Wishlist.js`) renders: a guest banner (opens AuthModal — guest wishlists work locally and sync on login via `WishlistContext`), header with count + Sort select (`dateDesc|dateAsc|priceLow|priceHigh|ratingHigh`) + Clear All, a `ProductCard` grid with a per-cell "Move to Cart" button, a 300ms removal exit animation, an empty state, and a "You May Also Like" rail seeded from the newest item (`products.getRelated`, fallback `getFeatured`, deduped, cap 10).

## Objective

Restyle the wishlist into a personal editorial collection page — calm header, airy saved-pieces grid, dignified guest invitation — with sync, sort, move-to-cart, and recommendation behaviors untouched.

## Scope — files/areas to touch

- `src/pages/Wishlist/Wishlist.js` + `Wishlist.module.css`
- Nothing else (`WishlistContext`, ProductCard, RelatedProducts are consumed as-is).

## Brand & design requirements

1. **Header:** serif title ("Your Collection" / "Saved Pieces" energy — keep it honest and simple), muted count line, Sort as a quiet underline select, Clear All as a hairline text-button with its existing confirmation behavior.
2. **Guest banner:** an elegant invitation band (hairline, serif line, "Sign in to keep your collection" + `openAuthModal("login")`) — informative, not nagging; guests still see their local list beneath it.
3. **Grid:** Prompt 09 cards in an airy 4/3/2/1 grid; the per-cell "Move to Cart" affordance restyled as a quiet full-width hairline button under each card (disabled styling when out of stock, as now); the 300ms `removingId` exit becomes a soft fade/collapse.
4. **Empty state:** warm editorial moment — refined line-art heart or typographic composition + "Explore the collection" → `/products`.
5. **Recommendation rail:** "You May Also Like" via the restyled `RelatedProducts`; skeleton rail on `sf-skeleton` primitives while loading.
6. Dark parity via tokens.

## Functional guardrails

1. Preserve all functionality & the API contract: `useWishlist` surface (`wishlistItems, isLoading, removeFromWishlist, clearWishlist, toggleWishlist, isInWishlist`) and the guest→login sync behavior (context-owned — do not touch `WishlistContext.js`); Move to Cart = `addToCart(buildCartItem(...))` + silent remove, exactly as now; sort options + logic; rec seeding (`getRelated` on newest, `getFeatured` fallback, dedupe vs `wishlistIdSet`).
2. Cards deep-link via stored `slug` (falls back to productId) — preserved by using ProductCard as-is.
3. Tokens/primitives only; zero hex.
4. Do NOT modify the admin panel.
5. Responsive + accessible: sort labeled; Clear All reachable; removal animation honors reduced motion; grid collapses cleanly; guest banner button focusable.
6. No fabricated trust signals — the rail is labeled as curation, counts are real.
7. Test before done — see below.

## Implementation notes

- Test the full sync story: build a guest wishlist → log in (user@example.com / password123) → lists merge; log out → local clears per context rules. You're not changing it — you're verifying the restyle didn't break render states around it.
- Out-of-stock: ensure at least one seeded saved-item scenario is checked (save an OOS product first).
- Keep the page's h1 semantics.

## Acceptance criteria

- [ ] Page reads as an editorial personal collection — clearly restyled.
- [ ] Guest: banner + local list + heart toggles work; login syncs/merges; count updates in Header/BottomNav badges.
- [ ] Sort all five options; Clear All confirms and empties; empty state renders with working CTA.
- [ ] Move to Cart: adds correct default variant line, silently removes from list, drawer opens; disabled for OOS.
- [ ] Rec rail renders (seeded from newest item), deduped against saved items.
- [ ] Light/dark parity; 375→1440; reduced motion; no hex.

## Test & QA

- `npm run dev`: guest flow, then logged-in flow (add/remove from Home, Products, PDP; verify page reflects instantly).
- Move 2 items to cart → drawer lines correct → wishlist rows gone.
- Empty the list → empty state; save again from the rec rail.
- Keyboard pass on sort/clear/cards/move buttons.
- Both themes; 375/768/1280.
- Admin untouched.
