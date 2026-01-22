import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    gradients: {
      primary: string;
      primaryReverse: string;
      light: string;
      middle: string;
    };
  }
  interface ThemeOptions {
    gradients?: {
      primary?: string;
      primaryReverse?: string;
      light?: string;
      middle?: string;
    };
  }
}
