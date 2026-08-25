import React from "react";

// Resolve the active theme without depending on React context (this component
// must work even if the provider tree above it failed to render).
const isDarkTheme = () => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch {
    return false;
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("=== CAUGHT ERROR ===", error);
    console.error("Component stack:", info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    // Full navigation resets the broken React tree, even outside the Router.
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const dark = isDarkTheme();
    // Meghali's Silk brand palette mirrored here as literals on purpose: this
    // boundary must render even when the provider tree (and the body.dark class
    // the CSS tokens key off) failed to mount, so it cannot rely on var(--sf-*).
    // SYNC SOURCE: src/theme/storefront-tokens.css — each literal below is the
    // resolved value of the --sf-* token named in its comment. Re-copy them
    // whenever that file's palette changes; nothing here updates automatically.
    const palette = dark
      ? {
          bg: "#14120F", // --sf-color-bg
          card: "#1B1815", // --sf-color-surface
          border: "rgba(244, 239, 230, 0.10)", // --sf-color-border
          heading: "#F4EFE6", // --sf-color-text
          text: "#C4BCAE", // --sf-color-text-secondary
          detailsBg: "#221E1A", // --sf-color-surface-2
          detailsText: "#E08472", // --sf-color-danger
          primaryBg: "#F4EFE6", // --sf-color-emerald (inverted ink CTA)
          primaryText: "#14120F", // --sf-color-emerald-contrast
          ghostBorder: "rgba(227, 185, 94, 0.30)", // --sf-color-border-strong
          ghostText: "#F4EFE6", // --sf-color-text
          shadow: "0 20px 48px rgba(0, 0, 0, 0.65)", // --sf-shadow-lg
        }
      : {
          bg: "#FAF6EC", // --sf-color-bg
          card: "#FFFFFF", // --sf-color-surface
          border: "#E8DFCD", // --sf-color-border
          heading: "#1D1A16", // --sf-color-text
          text: "#5C554A", // --sf-color-text-secondary
          detailsBg: "#F2ECE1", // --sf-color-surface-2
          detailsText: "#9E3B2E", // --sf-color-danger
          primaryBg: "#1D1A16", // --sf-color-emerald (the ink CTA)
          primaryText: "#FAF6EC", // --sf-color-emerald-contrast
          ghostBorder: "#D6C9B2", // --sf-color-border-strong
          ghostText: "#1D1A16", // --sf-color-text
          shadow: "0 20px 48px rgba(29, 26, 22, 0.12)", // --sf-shadow-lg
        };

    // Editorial button: near-rectangular, uppercase Inter, wide tracking —
    // the inline twin of `.sf-btn` in storefront-primitives.css.
    const btnBase = {
      padding: "14px 28px",
      borderRadius: "2px", // --sf-radius-sm
      fontSize: "0.75rem", // --sf-text-xs
      fontWeight: 500, // --sf-font-medium
      textTransform: "uppercase",
      letterSpacing: "0.14em", // --sf-tracking-wide
      cursor: "pointer",
      transition: "background-color 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      fontFamily: "inherit",
    };

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: palette.bg,
          // --sf-font-family
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: "4px", // --sf-radius-md
            padding: "48px 32px",
            textAlign: "center",
            boxShadow: palette.shadow,
          }}
        >
          <div style={{ fontSize: "44px", lineHeight: 1, marginBottom: "20px" }}>
            <span role="img" aria-label="warning">
              ⚠️
            </span>
          </div>
          <h1
            style={{
              margin: "0 0 12px",
              // --sf-font-display / --sf-leading-display
              fontFamily:
                '"Cormorant Garamond", "Playfair Display", Georgia, serif',
              fontSize: "2.25rem",
              fontWeight: 600,
              lineHeight: 1.1,
              color: palette.heading,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: "0 0 32px",
              fontSize: "1rem",
              lineHeight: 1.7, // --sf-leading-relaxed
              color: palette.text,
            }}
          >
            An unexpected error occurred while rendering this page. You can try
            reloading, or head back to the homepage.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                ...btnBase,
                border: `1px solid ${palette.primaryBg}`,
                color: palette.primaryText,
                background: palette.primaryBg,
              }}
            >
              Reload Page
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                ...btnBase,
                background: "transparent",
                color: palette.ghostText,
                border: `1px solid ${palette.ghostBorder}`,
              }}
            >
              Go Home
            </button>
          </div>

          {this.state.error && (
            <details
              style={{
                marginTop: "28px",
                textAlign: "left",
                color: palette.text,
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  userSelect: "none",
                }}
              >
                Error details
              </summary>
              <pre
                style={{
                  marginTop: "12px",
                  padding: "16px",
                  borderRadius: "2px", // --sf-radius-sm
                  background: palette.detailsBg,
                  color: palette.detailsText,
                  fontSize: "0.8rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "240px",
                  overflow: "auto",
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
