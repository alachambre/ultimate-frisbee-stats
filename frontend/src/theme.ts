import { createTheme } from "@mui/material/styles";

const primaryMain = "#2F6690";
const primarySoft = "#EAF3F8";
const primaryBorder = "#B9D5E5";
const primaryDark = "#245173";
const secondaryMain = "#38bdf8";
const secondaryLight = "#7dd3fc";
const secondaryDark = "#0284c7";
const pageBackground = "#f5f7fa";
const paperBackground = "#ffffff";
const defenseMain = "#2d7a3e";
const defenseLight = "#4c9560";
const defenseDark = "#1b5e20";
const defenseSoft = "#eaf6ee";
const defenseBorder = "#b7dec0";
const dangerMain = "#d92d20";
const dangerLight = "#f97066";
const dangerDark = "#b42318";
const warningMain = "#f79009";
const warningLight = "#fdb022";
const warningDark = "#b54708";
const performanceHigh = "#84cc16";
const performanceVeryHigh = "#16a34a";
const effortMain = "#8B5E34";
const neutralSeries = "#6b7280";

export function createAppTheme() {
  return createTheme({
    palette: {
      mode: "light",
      primary: {
        main: primaryMain,
        light: primarySoft,
        dark: primaryDark,
        contrastText: paperBackground,
      },
      secondary: {
        main: secondaryMain,
        light: secondaryLight,
        dark: secondaryDark,
      },
      success: {
        main: defenseMain,
        light: defenseLight,
        dark: defenseDark,
        contrastText: paperBackground,
      },
      error: {
        main: dangerMain,
        light: dangerLight,
        dark: dangerDark,
        contrastText: paperBackground,
      },
      warning: {
        main: warningMain,
        light: warningLight,
        dark: warningDark,
        contrastText: "#1f2937",
      },
      info: {
        main: primaryMain,
        light: primarySoft,
        dark: primaryDark,
        contrastText: paperBackground,
      },
      background: {
        default: pageBackground,
        paper: paperBackground,
      },
    },
    gradients: {
      primary: `linear-gradient(135deg, ${primaryDark} 0%, ${secondaryMain} 100%)`,
      primaryReverse: `linear-gradient(180deg, ${primaryDark} 0%, ${secondaryMain} 100%)`,
      light: `linear-gradient(to bottom, ${pageBackground} 0%, ${paperBackground} 100%)`,
      middle: "#2b7cc1",
    },
    colors: {
      offense: {
        main: primaryMain,
        light: "#5b8cb1",
        dark: primaryDark,
        soft: primarySoft,
        border: primaryBorder,
      },
      defense: {
        main: defenseMain,
        light: defenseLight,
        dark: defenseDark,
        soft: defenseSoft,
        border: defenseBorder,
      },
      men: {
        main: primaryMain,
      },
      women: {
        main: "#309ac8",
      },
      pull: {
        main: defenseMain,
      },
      performance: {
        veryLow: dangerMain,
        low: warningMain,
        medium: warningLight,
        high: performanceHigh,
        veryHigh: performanceVeryHigh,
      },
      gameHistory: {
        effort: effortMain,
        chart: {
          ourSeries: primaryMain,
          opponentSeries: neutralSeries,
          selectedPoint: primaryMain,
        },
        point: {
          default: primaryMain,
          break: performanceVeryHigh,
          broken: dangerMain,
          effort: effortMain,
          running: defenseMain,
          special: warningLight,
        },
        moment: {
          default: primaryMain,
          break: performanceVeryHigh,
          broken: dangerMain,
          effort: effortMain,
          special: warningLight,
        },
      },
      newUi: {
        primary: primaryMain,
        primarySoft,
        primaryBorder,
      },
    },
  });
}

export const appTheme = createAppTheme();
