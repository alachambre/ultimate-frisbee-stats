import "@mui/material/styles";

// Augment @mui/material/styles for createTheme
declare module "@mui/material/styles" {
  interface Theme {
    gradients: {
      primary: string;
      primaryReverse: string;
      light: string;
      middle: string;
    };
    colors: {
      offense: {
        main: string;
        light: string;
        dark: string;
      };
      defense: {
        main: string;
        light: string;
        dark: string;
      };
      men: {
        main: string;
      };
      women: {
        main: string;
      };
      pull: {
        main: string;
      };
      performance: {
        veryLow: string;
        low: string;
        medium: string;
        high: string;
        veryHigh: string;
      };
    };
  }
  interface ThemeOptions {
    gradients?: {
      primary?: string;
      primaryReverse?: string;
      light?: string;
      middle?: string;
    };
    colors?: {
      offense?: {
        main?: string;
        light?: string;
        dark?: string;
      };
      defense?: {
        main?: string;
        light?: string;
        dark?: string;
      };
      men?: {
        main?: string;
      };
      women?: {
        main?: string;
      };
      pull?: {
        main?: string;
      };
      performance?: {
        veryLow?: string;
        low?: string;
        medium?: string;
        high?: string;
        veryHigh?: string;
      };
    };
  }
}

// Augment @mui/system for sx prop support
declare module "@mui/system" {
  interface Theme {
    gradients: {
      primary: string;
      primaryReverse: string;
      light: string;
      middle: string;
    };
    colors: {
      offense: {
        main: string;
        light: string;
        dark: string;
      };
      defense: {
        main: string;
        light: string;
        dark: string;
      };
      men: {
        main: string;
      };
      women: {
        main: string;
      };
      pull: {
        main: string;
      };
      performance: {
        veryLow: string;
        low: string;
        medium: string;
        high: string;
        veryHigh: string;
      };
    };
  }
}
