import { createTheme } from "@mui/material/styles";

export function createAppTheme() {
  return createTheme({
    palette: {
      mode: "light",
      primary: {
        main: "#1e3a8a",
        light: "#3b82f6",
        dark: "#1e40af",
      },
      secondary: {
        main: "#38bdf8",
        light: "#7dd3fc",
        dark: "#0284c7",
      },
      background: {
        default: "#f5f7fa",
        paper: "#ffffff",
      },
    },
    gradients: {
      primary: "linear-gradient(135deg, #1e3a8a 0%, #38bdf8 100%)",
      primaryReverse: "linear-gradient(180deg, #1e3a8a 0%, #38bdf8 100%)",
      light: "linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)",
      middle: "#2b7cc1",
    },
    colors: {
      offense: {
        main: "#1e3a8a",
        light: "#3b82f6",
        dark: "#1e40af",
      },
      defense: {
        main: "#1e3a8a",
        light: "#3b82f6",
        dark: "#1e40af",
      },
      men: {
        main: "#1e3a8a",
      },
      women: {
        main: "#38bdf8",
      },
      pull: {
        main: "#2d7a3e",
      },
      performance: {
        veryLow: "#d92d20",
        low: "#f79009",
        medium: "#fdb022",
        high: "#84cc16",
        veryHigh: "#16a34a",
      },
      newUi: {
        primary: "#2F6690",
        primarySoft: "#EAF3F8",
        primaryBorder: "#B9D5E5",
      },
    },
  });
}

export const appTheme = createAppTheme();
