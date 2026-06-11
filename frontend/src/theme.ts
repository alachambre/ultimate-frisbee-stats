import { createTheme } from "@mui/material/styles";

export type AppThemeMode = "light" | "dark";

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

const darkPrimaryMain = "#8bb9d4";
const darkPrimarySoft = "#173244";
const darkPrimaryBorder = "#3f789e";
const darkPrimaryDark = "#5b8cb1";
const darkPrimaryActionHover = "#3d82a8";
const darkPrimarySurface = "#23465d";
const darkSecondaryMain = "#67d3f3";
const darkSecondaryLight = "#a5e7fb";
const darkSecondaryDark = "#309ac8";
const darkPageBackground = "#101418";
const darkPaperBackground = "#171c22";
const darkElevatedBackground = "#1d242b";
const darkTextPrimary = "#f4f7fb";
const darkTextSecondary = "#aab6c3";
const darkDivider = "#2b3440";
const darkDefenseMain = "#7bcf8f";
const darkDefenseLight = "#a7e0b5";
const darkDefenseDark = "#4c9560";
const darkDefenseSoft = "#173322";
const darkDefenseBorder = "#356c44";
const darkDangerMain = "#ff8a80";
const darkDangerLight = "#ffb4aa";
const darkDangerDark = "#f97066";
const darkWarningMain = "#ffbd6b";
const darkWarningLight = "#ffd08a";
const darkWarningDark = "#f79009";
const darkPerformanceHigh = "#a8df5a";
const darkPerformanceVeryHigh = "#67c983";
const darkEffortMain = "#c99c6d";
const darkNeutralSeries = "#c0c8d2";
const darkWomenMain = "#7bc8e6";

export function createAppTheme(mode: AppThemeMode = "light") {
  const isDark = mode === "dark";
  const resolvedPrimaryMain = isDark ? darkPrimaryMain : primaryMain;
  const resolvedPrimarySoft = isDark ? darkPrimarySoft : primarySoft;
  const resolvedPrimaryBorder = isDark ? darkPrimaryBorder : primaryBorder;
  const resolvedPrimaryDark = isDark ? darkPrimaryDark : primaryDark;
  const resolvedSecondaryMain = isDark ? darkSecondaryMain : secondaryMain;
  const resolvedSecondaryLight = isDark ? darkSecondaryLight : secondaryLight;
  const resolvedSecondaryDark = isDark ? darkSecondaryDark : secondaryDark;
  const resolvedPageBackground = isDark ? darkPageBackground : pageBackground;
  const resolvedPaperBackground = isDark ? darkPaperBackground : paperBackground;
  const resolvedDefenseMain = isDark ? darkDefenseMain : defenseMain;
  const resolvedDefenseLight = isDark ? darkDefenseLight : defenseLight;
  const resolvedDefenseDark = isDark ? darkDefenseDark : defenseDark;
  const resolvedDefenseSoft = isDark ? darkDefenseSoft : defenseSoft;
  const resolvedDefenseBorder = isDark ? darkDefenseBorder : defenseBorder;
  const resolvedDangerMain = isDark ? darkDangerMain : dangerMain;
  const resolvedDangerLight = isDark ? darkDangerLight : dangerLight;
  const resolvedDangerDark = isDark ? darkDangerDark : dangerDark;
  const resolvedWarningMain = isDark ? darkWarningMain : warningMain;
  const resolvedWarningLight = isDark ? darkWarningLight : warningLight;
  const resolvedWarningDark = isDark ? darkWarningDark : warningDark;
  const resolvedPerformanceHigh = isDark ? darkPerformanceHigh : performanceHigh;
  const resolvedPerformanceVeryHigh = isDark
    ? darkPerformanceVeryHigh
    : performanceVeryHigh;
  const resolvedEffortMain = isDark ? darkEffortMain : effortMain;
  const resolvedNeutralSeries = isDark ? darkNeutralSeries : neutralSeries;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: resolvedPrimaryMain,
        light: resolvedPrimarySoft,
        dark: resolvedPrimaryDark,
        contrastText: isDark ? darkPageBackground : paperBackground,
      },
      secondary: {
        main: resolvedSecondaryMain,
        light: resolvedSecondaryLight,
        dark: resolvedSecondaryDark,
      },
      success: {
        main: resolvedDefenseMain,
        light: resolvedDefenseLight,
        dark: resolvedDefenseDark,
        contrastText: isDark ? darkPageBackground : paperBackground,
      },
      error: {
        main: resolvedDangerMain,
        light: resolvedDangerLight,
        dark: resolvedDangerDark,
        contrastText: isDark ? darkPageBackground : paperBackground,
      },
      warning: {
        main: resolvedWarningMain,
        light: resolvedWarningLight,
        dark: resolvedWarningDark,
        contrastText: isDark ? darkPageBackground : "#1f2937",
      },
      info: {
        main: resolvedPrimaryMain,
        light: resolvedPrimarySoft,
        dark: resolvedPrimaryDark,
        contrastText: isDark ? darkPageBackground : paperBackground,
      },
      background: {
        default: resolvedPageBackground,
        paper: resolvedPaperBackground,
      },
      ...(isDark
        ? {
            divider: darkDivider,
            text: {
              primary: darkTextPrimary,
              secondary: darkTextSecondary,
            },
          }
        : {}),
    },
    gradients: {
      primary: `linear-gradient(135deg, ${resolvedPrimaryDark} 0%, ${resolvedSecondaryMain} 100%)`,
      primaryReverse: `linear-gradient(180deg, ${resolvedPrimaryDark} 0%, ${resolvedSecondaryMain} 100%)`,
      light: `linear-gradient(to bottom, ${resolvedPageBackground} 0%, ${
        isDark ? darkElevatedBackground : paperBackground
      } 100%)`,
      middle: isDark ? resolvedPrimaryMain : "#2b7cc1",
    },
    colors: {
      offense: {
        main: resolvedPrimaryMain,
        light: isDark ? darkSecondaryLight : "#5b8cb1",
        dark: resolvedPrimaryDark,
        soft: resolvedPrimarySoft,
        border: resolvedPrimaryBorder,
      },
      defense: {
        main: resolvedDefenseMain,
        light: resolvedDefenseLight,
        dark: resolvedDefenseDark,
        soft: resolvedDefenseSoft,
        border: resolvedDefenseBorder,
      },
      men: {
        main: resolvedPrimaryMain,
      },
      women: {
        main: isDark ? darkWomenMain : "#309ac8",
      },
      pull: {
        main: resolvedDefenseMain,
      },
      performance: {
        veryLow: resolvedDangerMain,
        low: resolvedWarningMain,
        medium: resolvedWarningLight,
        high: resolvedPerformanceHigh,
        veryHigh: resolvedPerformanceVeryHigh,
      },
      gameHistory: {
        effort: resolvedEffortMain,
        chart: {
          ourSeries: resolvedPrimaryMain,
          opponentSeries: resolvedNeutralSeries,
          selectedPoint: resolvedPrimaryMain,
        },
        point: {
          default: resolvedPrimaryMain,
          break: resolvedPerformanceVeryHigh,
          broken: resolvedDangerMain,
          effort: resolvedEffortMain,
          running: resolvedDefenseMain,
          special: resolvedWarningLight,
        },
        moment: {
          default: resolvedPrimaryMain,
          break: resolvedPerformanceVeryHigh,
          broken: resolvedDangerMain,
          effort: resolvedEffortMain,
          special: resolvedWarningLight,
        },
      },
      newUi: {
        primary: resolvedPrimaryMain,
        primarySoft: resolvedPrimarySoft,
        primaryBorder: resolvedPrimaryBorder,
        primaryAction: isDark ? darkPrimarySurface : primaryMain,
        primaryActionHover: isDark ? darkPrimaryActionHover : primaryDark,
        primaryActionText: isDark ? darkTextPrimary : paperBackground,
        primarySurface: isDark ? darkPrimarySurface : primaryMain,
        primarySurfaceText: isDark ? darkTextPrimary : paperBackground,
      },
    },
  });
}

export const appTheme = createAppTheme("light");
