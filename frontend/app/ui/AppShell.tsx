// frontend/app/ui/AppShell.tsx
import { useState } from "react";
import {
  AppBar, Box, Button, Drawer, IconButton, List, ListItemButton, ListItemText,
  Toolbar, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router";
import { filterNavForRoles } from "./NavConfig";
import { NavItem } from "./NavItem";

type Props = {
  isAuthenticated: boolean;
  roles: string[];
  onLogout: () => void;
};

export function AppShell({ isAuthenticated, roles, onLogout }: Props) {
  const theme  = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = filterNavForRoles(roles, isAuthenticated);

  return (
    <AppBar position="fixed" color="default" elevation={0}>
      <Toolbar sx={{ gap: 1, minHeight: 74, px: { xs: 1, md: 2 } }}>
        <Typography
          variant="h6"
          component="button"
          onClick={() => navigate("/")}
          style={{ border: "none", background: "transparent", cursor: "pointer", font: "inherit", fontWeight: 700, marginRight: "auto", color: "#17322d" }}
        >
          Reserva de Salas
        </Typography>

        {isMobile ? (
          <IconButton aria-label="Abrir menu" onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
            {items.map((it) => <NavItem key={it.path} path={it.path} label={it.label} />)}
            {isAuthenticated ? (
              <Button variant="outlined" color="inherit" onClick={onLogout} sx={{ borderColor: "rgba(23,50,45,0.28)" }}>Sair</Button>
            ) : (
              <>
                <Button color="inherit" href="/login">Entrar</Button>
                <Button variant="contained" href="/register">Cadastrar</Button>
              </>
            )}
          </Box>
        )}

        <Drawer anchor="right" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}>
          <Box sx={{ width: 300, p: 2 }} role="navigation" aria-label="Menu principal">
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="h6">Menu</Typography>
              <IconButton aria-label="Fechar menu" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
            </Box>
            <List>
              {items.map((it) => (
                <ListItemButton key={it.path} onClick={() => { navigate(it.path); setOpen(false); }} sx={{ minHeight: 48, borderRadius: 1 }}>
                  <ListItemText primary={it.label} />
                </ListItemButton>
              ))}
              {isAuthenticated && (
                <ListItemButton onClick={() => { onLogout(); setOpen(false); }} sx={{ minHeight: 48, color: "error.main" }}>
                  <ListItemText primary="Sair" />
                </ListItemButton>
              )}
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}
