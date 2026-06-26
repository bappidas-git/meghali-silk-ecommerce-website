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
    // Keep these in sync with storefront-tokens.css.
    const palette = dark
      ? {
          bg: "#0B0C0B",
          card: "#15171A",
          border: "rgba(203, 163, 90, 0.28)",
          heading: "#F3EFE6",
          text: "#C3C9C4",
          detailsBg: "#1B1E20",
          detailsText: "#f4a9a9",
          primaryGradient:
            "linear-gradient(135deg, #E6C27A 0%, #CBA35A 50%, #B6863C 100%)",
          primaryText: "#0A2E24",
          ghostBorder: "rgba(255,255,255,0.22)",
          ghostText: "#F3EFE6",
        }
      : {
          bg: "#FBF8F2",
          card: "#FFFFFF",
          border: "rgba(203, 163, 90, 0.28)",
          heading: "#10221C",
          text: "#4A5550",
          detailsBg: "#F4EFE6",
          detailsText: "#b4232b",
          primaryGradient:
            "linear-gradient(135deg, #E6C27A 0%, #CBA35A 50%, #B6863C 100%)",
          primaryText: "#0A2E24",
          ghostBorder: "rgba(16,34,28,0.18)",
          ghostText: "#10221C",
        };

    const btnBase = {
      padding: "12px 24px",
      borderRadius: "12px",
      fontSize: "0.95rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
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
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: "20px",
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: dark
              ? "0 20px 60px rgba(0,0,0,0.45)"
              : "0 20px 60px rgba(11,59,46,0.15)",
          }}
        >
          <div style={{ fontSize: "52px", lineHeight: 1, marginBottom: "16px" }}>
            <span role="img" aria-label="warning">
              ⚠️
            </span>
          </div>
          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: palette.heading,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: "0 0 28px",
              fontSize: "1rem",
              lineHeight: 1.6,
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
                border: "none",
                color: palette.primaryText,
                background: palette.primaryGradient,
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
                  borderRadius: "10px",
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
