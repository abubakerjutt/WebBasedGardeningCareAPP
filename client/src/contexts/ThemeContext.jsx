import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const ThemeContext = createContext();

const createAppTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#4caf50", // Green
        light: "#81c784",
        dark: "#388e3c",
      },
      secondary: {
        main: "#8bc34a", // Light Green
        light: "#aed581",
        dark: "#689f38",
      },
      background: {
        default: mode === "light" ? "#f8fdf8" : "#0a0f0a",
        paper: mode === "light" ? "#ffffff" : "#1a1f1a",
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow:
              mode === "light"
                ? "0 2px 8px rgba(0,0,0,0.1)"
                : "0 2px 8px rgba(0,0,0,0.3)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
};

export const AppThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState("system");
  const [actualMode, setActualMode] = useState("light");

  // Function to get system theme preference
  const getSystemTheme = () => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode");
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Update actual mode based on theme mode
  useEffect(() => {
    if (themeMode === "system") {
      const systemTheme = getSystemTheme();
      setActualMode(systemTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e) => {
        if (themeMode === "system") {
          setActualMode(e.matches ? "dark" : "light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      setActualMode(themeMode);
    }
  }, [themeMode]);

  // Function to update theme mode and save to localStorage
  const updateThemeMode = useCallback((newMode) => {
    setThemeMode(newMode);
    localStorage.setItem("themeMode", newMode);
  }, []);

  const theme = createAppTheme(actualMode);

  const value = {
    themeMode,
    actualMode,
    setThemeMode: updateThemeMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
};
