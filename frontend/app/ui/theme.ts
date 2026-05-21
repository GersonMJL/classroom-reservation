// frontend/app/ui/theme.ts
import { createTheme } from "@mui/material/styles";
import { tokens } from "./tokens";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary:   { main: tokens.color.primary.main,   dark: tokens.color.primary.dark,   light: tokens.color.primary.light,   contrastText: tokens.color.primary.contrast },
    secondary: { main: tokens.color.secondary.main, dark: tokens.color.secondary.dark, light: tokens.color.secondary.light, contrastText: tokens.color.secondary.contrast },
    background:{ default: tokens.color.surface.default, paper: tokens.color.surface.paper },
    text:      { primary: tokens.color.text.primary,   secondary: tokens.color.text.secondary },
    error:     { main: tokens.color.status.danger },
    warning:   { main: tokens.color.status.warning },
    success:   { main: tokens.color.status.success },
    info:      { main: tokens.color.status.info },
  },
  shape: { borderRadius: tokens.radius.lg },
  typography: {
    fontFamily: tokens.typography.fontBody,
    h1: { fontFamily: tokens.typography.fontHeading, fontWeight: 700 },
    h2: { fontFamily: tokens.typography.fontHeading, fontWeight: 700 },
    h3: { fontFamily: tokens.typography.fontHeading, fontWeight: 700 },
    h4: { fontFamily: tokens.typography.fontHeading, fontWeight: 700 },
    h5: { fontFamily: tokens.typography.fontHeading, fontWeight: 700 },
    h6: { fontFamily: tokens.typography.fontHeading, fontWeight: 700 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at 10% 10%, rgba(95,178,154,0.2), transparent 35%), " +
            "radial-gradient(circle at 90% 0%, rgba(214,146,88,0.15), transparent 30%), " +
            tokens.color.surface.default,
        },
        ":focus-visible": { outline: `2px solid ${tokens.color.primary.main}`, outlineOffset: 2 },
      },
    },
    MuiPaper:  { styleOverrides: { root: { border: `1px solid ${tokens.color.border.subtle}`, boxShadow: tokens.shadow.md } } },
    MuiAppBar: { styleOverrides: { root: { backdropFilter: "blur(14px)", borderBottom: `1px solid ${tokens.color.border.subtle}`, boxShadow: tokens.shadow.sm, backgroundColor: "rgba(255,255,255,0.82)" } } },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.pill,
          minHeight: 44,
          transition: `transform ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}, box-shadow ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}`,
          "&:active": { transform: "scale(0.97)" },
        },
        contained: { boxShadow: "0 10px 22px rgba(31,111,95,0.22)" },
      },
    },
    MuiChip:      { styleOverrides: { root: { borderRadius: tokens.radius.pill, fontWeight: 600 } } },
    MuiTableHead: { styleOverrides: { root: { backgroundColor: "#eef4f1" } } },
    MuiTableCell: { styleOverrides: { head: { color: "#2e4740", fontWeight: 700 } } },
    MuiIconButton:{ styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
  },
});
