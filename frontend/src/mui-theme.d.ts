import "@mui/material/styles";

type TeamSideColorScale = {
  main: string;
  light: string;
  dark: string;
  soft: string;
  border: string;
};

type GameHistoryToneColors = {
  default: string;
  break: string;
  broken: string;
  effort: string;
  special: string;
};

type GameHistoryPointColors = GameHistoryToneColors & {
  running: string;
};

type GameHistoryChartColors = {
  ourSeries: string;
  opponentSeries: string;
  selectedPoint: string;
};

type GameHistoryColors = {
  effort: string;
  chart: GameHistoryChartColors;
  point: GameHistoryPointColors;
  moment: GameHistoryToneColors;
};

type TeamSideColorOptions = Partial<TeamSideColorScale>;

type GameHistoryColorOptions = {
  effort?: string;
  chart?: Partial<GameHistoryChartColors>;
  point?: Partial<GameHistoryPointColors>;
  moment?: Partial<GameHistoryToneColors>;
};

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
      offense: TeamSideColorScale;
      defense: TeamSideColorScale;
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
      gameHistory: GameHistoryColors;
      newUi: {
        primary: string;
        primarySoft: string;
        primaryBorder: string;
        primaryAction: string;
        primaryActionHover: string;
        primaryActionText: string;
        primarySurface: string;
        primarySurfaceText: string;
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
      offense?: TeamSideColorOptions;
      defense?: TeamSideColorOptions;
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
      gameHistory?: GameHistoryColorOptions;
      newUi?: {
        primary?: string;
        primarySoft?: string;
        primaryBorder?: string;
        primaryAction?: string;
        primaryActionHover?: string;
        primaryActionText?: string;
        primarySurface?: string;
        primarySurfaceText?: string;
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
      offense: TeamSideColorScale;
      defense: TeamSideColorScale;
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
      gameHistory: GameHistoryColors;
      newUi: {
        primary: string;
        primarySoft: string;
        primaryBorder: string;
        primaryAction: string;
        primaryActionHover: string;
        primaryActionText: string;
        primarySurface: string;
        primarySurfaceText: string;
      };
    };
  }
}
