import React, { createContext, useState, useContext, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LIGHT, DARK } from "../theme/colors";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeContextProvider");
  }
  return context;
};

// Alias for useTheme to match naming convention
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeContextProvider");
  }
  return { mode: context.isDarkMode ? "dark" : "light", toggleTheme: context.toggleTheme };
};

// Small icon buttons (admin table actions, input adornments, dialog controls)
// keep their compact desktop density but get a padded ≥40px hit area on
// touch-sized screens. Shared by the light and dark themes.
const iconButtonTouchOverrides = {
  styleOverrides: {
    sizeSmall: {
      "@media (max-width: 768px)": {
        padding: 11,
      },
    },
  },
};

export const ThemeContextProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Light is the primary/default experience for Meghali's Silk — the warm
    // ivory editorial ground. With no saved choice we default to light; only an
    // explicit "dark" selection opts into the evening palette.
    // NB: the pre-mount script at the bottom of public/index.html MUST apply the
    // same rule, or the first paint flashes the wrong theme.
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.body.style.backgroundColor = isDarkMode ? DARK.background.default : LIGHT.background.default;

    // Add/remove .dark class on body for CSS selectors
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [isDarkMode]);

  const lightTheme = createTheme({
    palette: {
      mode: "light",
      primary: LIGHT.primary,
      secondary: LIGHT.secondary,
      background: LIGHT.background,
      text: LIGHT.text,
      action: {
        hover: "rgba(29, 26, 22, 0.06)", // --sf-color-primary-soft
      },
    },
    typography: {
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      // Display tier is set in Cormorant Garamond, tight, to match
      // --sf-font-display / --sf-leading-display in storefront-tokens.css.
      h1: {
        fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
        fontSize: "3.5rem",
        fontWeight: 600,
        lineHeight: 1.1,
      },
      h2: {
        fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
        fontSize: "2.75rem",
        fontWeight: 600,
        lineHeight: 1.15,
      },
      h3: {
        fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
        fontSize: "2.25rem",
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h4: {
        fontSize: "1.5rem",
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: "1.25rem",
        fontWeight: 500,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: "1rem",
        fontWeight: 500,
        lineHeight: 1.6,
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 4, // --sf-radius-md — classic, near-square
    },
    components: {
      // Editorial surfaces sit FLAT: no translateY lifts, no coloured glows.
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "4px",
            padding: "12px 28px",
            fontSize: "0.9375rem",
            letterSpacing: "0.02em",
            boxShadow: "none",
            transition: "background 0.2s cubic-bezier(0.22, 1, 0.36, 1), color 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
            "&:hover": {
              boxShadow: "none",
            },
          },
          contained: {
            background: LIGHT.gradient.primary,
            color: LIGHT.background.default,
            boxShadow: "none",
            "&:hover": {
              background: LIGHT.gradient.primaryReverse,
              boxShadow: "none",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            border: "1px solid #E8DFCD", // --sf-color-border hairline
            boxShadow: "none",
            transition: "border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
            "&:hover": {
              borderColor: "#D6C9B2", // --sf-color-border-strong
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: "4px",
              "&:hover fieldset": {
                borderColor: LIGHT.primary.main,
              },
              "&.Mui-focused fieldset": {
                borderColor: LIGHT.primary.main,
                borderWidth: "2px",
              },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: LIGHT.background.default,
            borderColor: "#E8DFCD",
            backgroundImage: "none",
            boxShadow: "0 20px 48px rgba(29, 26, 22, 0.12)", // --sf-shadow-lg
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: LIGHT.background.default,
            backgroundImage: "none",
            color: LIGHT.text.primary,
            borderBottom: "1px solid #E8DFCD",
            boxShadow: "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiIconButton: iconButtonTouchOverrides,
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode: "dark",
      primary: DARK.primary,
      secondary: DARK.secondary,
      background: DARK.background,
      text: DARK.text,
      action: {
        hover: "rgba(244, 239, 230, 0.08)", // --sf-color-primary-soft (dark)
      },
    },
    typography: {
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      // Display tier is set in Cormorant Garamond, tight, to match
      // --sf-font-display / --sf-leading-display in storefront-tokens.css.
      h1: {
        fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
        fontSize: "3.5rem",
        fontWeight: 600,
        lineHeight: 1.1,
      },
      h2: {
        fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
        fontSize: "2.75rem",
        fontWeight: 600,
        lineHeight: 1.15,
      },
      h3: {
        fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
        fontSize: "2.25rem",
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h4: {
        fontSize: "1.5rem",
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: "1.25rem",
        fontWeight: 500,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: "1rem",
        fontWeight: 500,
        lineHeight: 1.6,
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 4, // --sf-radius-md — classic, near-square
    },
    components: {
      // Same flat editorial treatment, re-derived for the evening palette.
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "4px",
            padding: "12px 28px",
            fontSize: "0.9375rem",
            letterSpacing: "0.02em",
            boxShadow: "none",
            transition: "background 0.2s cubic-bezier(0.22, 1, 0.36, 1), color 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
            "&:hover": {
              boxShadow: "none",
            },
          },
          contained: {
            background: DARK.gradient.primary,
            color: DARK.text.primary, // ivory label on the dark primary band
            boxShadow: "none",
            "&:hover": {
              background: DARK.gradient.primaryReverse,
              boxShadow: "none",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            background: DARK.background.paper,
            border: "1px solid rgba(244, 239, 230, 0.10)", // --sf-color-border
            boxShadow: "none",
            transition: "border-color 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
            "&:hover": {
              borderColor: "rgba(227, 185, 94, 0.30)", // --sf-color-border-strong
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: "4px",
              "&:hover fieldset": {
                borderColor: DARK.primary.main,
              },
              "&.Mui-focused fieldset": {
                borderColor: DARK.primary.main,
                borderWidth: "2px",
              },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: DARK.background.default,
            borderColor: "rgba(244, 239, 230, 0.10)",
            backgroundImage: "none",
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.65)", // --sf-shadow-lg (dark)
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: DARK.background.default,
            backgroundImage: "none",
            color: DARK.text.primary,
            borderBottom: "1px solid rgba(244, 239, 230, 0.10)",
            boxShadow: "none",
          },
        },
      },
      // MUI tints dark Paper by elevation; the editorial surfaces stay flat.
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiIconButton: iconButtonTouchOverrides,
    },
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
