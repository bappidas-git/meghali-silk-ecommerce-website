// =============================================================================
// documentTitle — who owns the browser tab
// =============================================================================
// Two things want to write `document.title`:
//
//   * StoreSettingsContext, which sets the store-wide default ("Meghali's Silk
//     — <tagline>") from Admin → Settings > General;
//   * a page with a title of its own — today the PDP, which uses the product's
//     Admin → Products → SEO > Meta Title.
//
// Without a rule between them the last effect to run wins, and because the
// settings request resolves on its own schedule that was the store title as
// often as not: filling in a product's Meta Title changed nothing. So the page
// claims the tab explicitly and the store default steps aside while a claim
// stands. The claim is released on unmount, which restores the default.
// =============================================================================

/**
 * The store-wide default title, from Admin → Settings > General. One definition
 * so the provider that sets it and the pages that restore it can never drift.
 */
export const storeDocumentTitle = (store) => {
  if (!store?.name) return "";
  return store.tagline ? `${store.name} — ${store.tagline}` : store.name;
};

let claimed = false;

/** A page takes the tab. Wins over the store default until released. */
export const setPageTitle = (title) => {
  if (!title) return;
  claimed = true;
  document.title = title;
};

/** The page is leaving — hand the tab back to the store default. */
export const releasePageTitle = (storeTitle) => {
  claimed = false;
  if (storeTitle) document.title = storeTitle;
};

/** The store default. A no-op while a page holds a claim. */
export const applyStoreTitle = (storeTitle) => {
  if (claimed || !storeTitle) return;
  document.title = storeTitle;
};
