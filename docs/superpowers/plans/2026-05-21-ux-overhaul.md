# Plano de melhoria de UX — Reserva de Salas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar a qualidade percebida e a usabilidade do frontend (React Router 7 + MUI v9) padronizando layout, navegação, estados de carregamento/vazio, formulários e acessibilidade — sem alterar funcionalidades existentes.

**Architecture:** O plano introduz uma camada de *design tokens + primitives* (`frontend/app/ui/`) consumida por todas as rotas. A `AppBar` monolítica é substituída por um `AppShell` responsivo (desktop topbar + mobile drawer + command palette). Listas e formulários ganham padrões consistentes (`DataTable`, `PageHeader`, `EmptyState`, `FormField`, `useToast`). As rotas existentes são refatoradas incrementalmente para usar essas primitivas; nenhuma rota é reescrita por completo no mesmo passo.

**Tech Stack:** React 19, React Router 7, MUI v9, TailwindCSS v4, TypeScript, Vite, dayjs.

**Princípios aplicados (ui-ux-pro-max — Quick Reference):**
- §1 Acessibilidade (CRITICAL): `color-contrast`, `focus-states`, `aria-labels`, `keyboard-nav`, `reduced-motion`.
- §2 Toque/Interação (CRITICAL): `touch-target-size` (≥44px), `press-feedback`, `loading-buttons`.
- §4 Estilo (HIGH): `consistency`, `primary-action`, `state-clarity`, `elevation-consistent`, `icon-style-consistent`.
- §5 Layout (HIGH): `mobile-first`, `breakpoint-consistency`, `horizontal-scroll`, `spacing-scale` 4/8.
- §7 Animação (MEDIUM): `duration-timing` 150–300ms, `transform-performance`, `motion-meaning`.
- §8 Formulários (MEDIUM): `input-labels`, `inline-validation`, `error-placement`, `focus-management`, `error-clarity`.
- §9 Navegação (HIGH): `nav-hierarchy`, `adaptive-navigation`, `nav-state-active`, `state-preservation`.

**Anti-padrões a remover (presentes hoje):**
- AppBar com 10+ botões em uma linha sem colapso responsivo (`overflow-menu`, `adaptive-navigation`).
- Cada botão de nav reimplementa estilo ativo/hover (~9 cópias) — viola `nav-state-active` por inconsistência e gera divergência futura.
- Rota `reservations.tsx` com 1438 linhas — viola `state-clarity` / manutenibilidade.
- `CircularProgress` único como único estado de loading — falta `progressive-loading` / skeleton.
- Modais com formulários longos em mobile (Dialog ocupa viewport pequeno) — viola `sheet-dismiss-confirm` / `touch-friendly-input`.
- Sem feedback de sucesso/erro global (toast) — viola `success-feedback` / `error-recovery`.

**Escopo fora deste plano:** novas features, dark mode (será deixado preparado mas não ativado), internacionalização, mudanças no backend, testes e2e.

**Localização:** todo texto de UI em pt-BR (CLAUDE.md).

---

## Estrutura de arquivos (novos)

```
frontend/app/ui/
├── tokens.ts                 # Tokens semânticos centrais (cores, espaçamento, raios, sombras, motion)
├── theme.ts                  # createTheme MUI alimentado por tokens
├── AppShell.tsx              # Layout responsivo (topbar desktop, drawer mobile, slot de conteúdo)
├── NavItem.tsx               # Botão de navegação único (estado ativo unificado)
├── NavConfig.ts              # Lista declarativa de rotas + roles requeridos
├── PageHeader.tsx            # Cabeçalho de página: título + descrição + ações + breadcrumb opcional
├── PageSection.tsx           # Card/Paper padronizado (espaçamento, sombra, radius)
├── EmptyState.tsx            # Estado vazio: ícone + título + descrição + CTA
├── DataTable.tsx             # Wrapper de Table com loading skeleton, vazio, paginação
├── TableSkeleton.tsx         # Skeleton rows para DataTable
├── StatusChip.tsx            # Chip semântico por status (cores consistentes)
├── FormField.tsx             # Wrapper TextField com label visível + helper + erro abaixo
├── FormDialog.tsx            # Dialog adaptativo (full-screen em mobile, modal em desktop)
├── ConfirmDialog.tsx         # Confirmação para ações destrutivas
├── useToast.tsx              # Provider + hook de notificações (sucesso/erro/info)
├── CommandPalette.tsx        # Cmd+K / Ctrl+K com navegação global
└── __tests__/                # Vitest para lógica (filter palette, role gating, etc.)

frontend/app/ui/index.ts      # Re-export barrel
```

**Arquivos modificados (refactor incremental):**
- `frontend/app/root.tsx` — extrai AppShell, remove duplicação de botões nav.
- `frontend/app/app.css` — adiciona variáveis CSS dos tokens, refina `prefers-reduced-motion`.
- Cada rota em `frontend/app/routes/*.tsx` — passa a usar `PageHeader`, `PageSection`, `EmptyState`, `DataTable`, `useToast`.

---

## Tarefa 1: Tokens semânticos e tema centralizado

**Files:**
- Create: `frontend/app/ui/tokens.ts`
- Create: `frontend/app/ui/theme.ts`
- Create: `frontend/app/ui/index.ts`
- Modify: `frontend/app/root.tsx` (linhas 37–139 → importa de `ui/theme`)
- Modify: `frontend/app/app.css` (acrescenta `:root` com variáveis CSS dos tokens)

- [ ] **Passo 1.1: Criar `tokens.ts` com a paleta atual extraída**

```ts
// frontend/app/ui/tokens.ts
export const tokens = {
  color: {
    primary:    { main: "#1f6f5f", dark: "#184f44", light: "#4a9a8a", contrast: "#f8fbf9" },
    secondary:  { main: "#b25e2e", dark: "#8b4721", light: "#d98b58", contrast: "#fff9f5" },
    surface:    { default: "#f3f5ef", paper: "#ffffff", elevated: "#fbfcfa" },
    text:       { primary: "#17322d", secondary: "#4f665f", disabled: "#8a9c95" },
    border:     { subtle: "rgba(31, 111, 95, 0.12)", strong: "rgba(31, 111, 95, 0.28)" },
    status: {
      success: "#1f6f5f",
      warning: "#b25e2e",
      danger:  "#9b2c2c",
      info:    "#2c5a8a",
      neutral: "#6b7a73",
    },
  },
  space:  { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 },
  radius: { sm: 6, md: 10, lg: 14, pill: 999 },
  shadow: {
    sm: "0 4px 12px rgba(23, 50, 45, 0.06)",
    md: "0 10px 30px rgba(23, 50, 45, 0.08)",
    lg: "0 18px 48px rgba(23, 50, 45, 0.12)",
  },
  motion: {
    duration: { fast: 120, base: 200, slow: 280 },
    easing:   { standard: "cubic-bezier(0.23, 1, 0.32, 1)", emphasized: "cubic-bezier(0.2, 0, 0, 1)" },
  },
  typography: {
    fontHeading: '"Space Grotesk", "Sora", sans-serif',
    fontBody:    '"Sora", "Space Grotesk", "Segoe UI", sans-serif',
    scale: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, "2xl": 32, "3xl": 40 },
  },
} as const;

export type Tokens = typeof tokens;
```

- [ ] **Passo 1.2: Criar `theme.ts` consumindo tokens**

```ts
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
```

- [ ] **Passo 1.3: Substituir o tema inline em `root.tsx`**

Em `frontend/app/root.tsx`, remover o bloco `const lightTheme = createTheme({...})` (linhas 37–139) e substituir o import:

```ts
import { lightTheme } from "./ui/theme";
```

- [ ] **Passo 1.4: Expor tokens como variáveis CSS em `app.css`**

Acrescentar no topo de `frontend/app/app.css` (depois do `@import "tailwindcss";`):

```css
:root {
  --color-primary: #1f6f5f;
  --color-secondary: #b25e2e;
  --color-surface: #f3f5ef;
  --color-text: #17322d;
  --color-text-secondary: #4f665f;
  --color-border-subtle: rgba(31, 111, 95, 0.12);
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-md: 0 10px 30px rgba(23, 50, 45, 0.08);
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --easing-standard: cubic-bezier(0.23, 1, 0.32, 1);
}
```

- [ ] **Passo 1.5: Verificar manualmente**

```bash
cd frontend && npm run typecheck && npm run dev
```

Expected: typecheck OK; navegar para `/` e `/environments` — aparência idêntica à anterior (refactor sem regressão visual).

- [ ] **Passo 1.6: Commit**

```bash
git add frontend/app/ui/tokens.ts frontend/app/ui/theme.ts frontend/app/ui/index.ts frontend/app/root.tsx frontend/app/app.css
git commit -m "refactor(ui): centraliza design tokens e tema em frontend/app/ui"
```

---

## Tarefa 2: AppShell responsivo com nav declarativa

**Files:**
- Create: `frontend/app/ui/NavConfig.ts`
- Create: `frontend/app/ui/NavItem.tsx`
- Create: `frontend/app/ui/AppShell.tsx`
- Create: `frontend/app/ui/__tests__/NavConfig.test.ts`
- Modify: `frontend/app/root.tsx` (substitui AppBar manual por `<AppShell>`)

- [ ] **Passo 2.1: Escrever teste falhando para filtragem por role**

```ts
// frontend/app/ui/__tests__/NavConfig.test.ts
import { describe, expect, it } from "vitest";
import { filterNavForRoles, NAV_ITEMS } from "../NavConfig";

describe("filterNavForRoles", () => {
  it("retorna itens públicos para usuário sem roles", () => {
    const items = filterNavForRoles([], false);
    expect(items.every(i => !i.requiresAuth)).toBe(true);
  });

  it("inclui Usuários apenas para admin", () => {
    const usersForUser    = filterNavForRoles(["user"], true).find(i => i.path === "/users");
    const usersForAdmin   = filterNavForRoles(["admin"], true).find(i => i.path === "/users");
    expect(usersForUser).toBeUndefined();
    expect(usersForAdmin).toBeDefined();
  });

  it("Aprovações disponível para admin e manager mas não para technician", () => {
    expect(filterNavForRoles(["admin"],      true).some(i => i.path === "/aprovacoes")).toBe(true);
    expect(filterNavForRoles(["manager"],    true).some(i => i.path === "/aprovacoes")).toBe(true);
    expect(filterNavForRoles(["technician"], true).some(i => i.path === "/aprovacoes")).toBe(false);
  });
});
```

- [ ] **Passo 2.2: Rodar teste — deve falhar**

```bash
cd frontend && npx vitest run app/ui/__tests__/NavConfig.test.ts
```

Expected: FAIL com `Cannot find module '../NavConfig'`.
(Se vitest não estiver instalado, adicionar: `npm i -D vitest @vitest/ui jsdom` e adicionar script `"test": "vitest"` em `package.json`. Em seguida re-rodar.)

- [ ] **Passo 2.3: Criar `NavConfig.ts`**

```ts
// frontend/app/ui/NavConfig.ts
export type Role = "admin" | "manager" | "technician" | "user";

export type NavItem = {
  path: string;
  label: string;
  group: "primary" | "operations" | "governance";
  requiresAuth: boolean;
  roles?: Role[]; // se vazio/ausente, qualquer autenticado
};

export const NAV_ITEMS: NavItem[] = [
  { path: "/reservas",              label: "Reservas",        group: "primary",    requiresAuth: true },
  { path: "/environments",          label: "Ambientes",       group: "primary",    requiresAuth: true },
  { path: "/resources",             label: "Recursos",        group: "primary",    requiresAuth: true },
  { path: "/purposes",              label: "Finalidades",     group: "primary",    requiresAuth: true },
  { path: "/organizational-units",  label: "Unidades Org.",   group: "primary",    requiresAuth: true },
  { path: "/qualifications",        label: "Qualificações",   group: "primary",    requiresAuth: true },
  { path: "/aprovacoes",            label: "Aprovações",      group: "operations", requiresAuth: true, roles: ["admin", "manager"] },
  { path: "/bloqueios",             label: "Bloqueios",       group: "operations", requiresAuth: true, roles: ["admin", "manager", "technician"] },
  { path: "/incidentes",            label: "Incidentes",      group: "operations", requiresAuth: true, roles: ["admin", "manager", "technician"] },
  { path: "/penalidades",           label: "Penalidades",     group: "governance", requiresAuth: true },
  { path: "/auditoria",             label: "Auditoria",       group: "governance", requiresAuth: true, roles: ["admin", "manager"] },
  { path: "/users",                 label: "Usuários",        group: "governance", requiresAuth: true, roles: ["admin"] },
];

export function filterNavForRoles(roles: string[], isAuthenticated: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.roles && !item.roles.some((r) => roles.includes(r))) return false;
    return true;
  });
}
```

- [ ] **Passo 2.4: Rodar teste — deve passar**

```bash
cd frontend && npx vitest run app/ui/__tests__/NavConfig.test.ts
```

Expected: PASS.

- [ ] **Passo 2.5: Criar `NavItem.tsx` — botão único, estado ativo unificado**

```tsx
// frontend/app/ui/NavItem.tsx
import { Button, alpha } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { tokens } from "./tokens";

type Props = {
  path: string;
  label: string;
  variant?: "primary" | "secondary";
  onNavigate?: () => void;
};

export function NavItem({ path, label, variant = "primary", onNavigate }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname.startsWith(path);
  const tint = variant === "secondary" ? tokens.color.secondary.main : tokens.color.primary.main;

  return (
    <Button
      variant={isActive ? "contained" : "text"}
      onClick={() => { navigate(path); onNavigate?.(); }}
      aria-current={isActive ? "page" : undefined}
      sx={{
        color: isActive ? "#fff" : "text.primary",
        backgroundColor: isActive ? tint : alpha(tint, 0.08),
        "&:hover": { backgroundColor: isActive ? tint : alpha(tint, 0.14) },
      }}
    >
      {label}
    </Button>
  );
}
```

- [ ] **Passo 2.6: Criar `AppShell.tsx` — topbar desktop + drawer mobile**

```tsx
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
```

- [ ] **Passo 2.7: Substituir AppBar inline em `root.tsx`**

Em `frontend/app/root.tsx`, remover todo o bloco `<AppBar>...</AppBar>` (linhas 240–437) e substituir por:

```tsx
{!isHomeRoute && (
  <AppShell
    isAuthenticated={isAuthenticated}
    roles={isBrowser ? getTokenRoles() : []}
    onLogout={handleLogout}
  />
)}
```

Adicionar `import { AppShell } from "./ui/AppShell";` no topo.

- [ ] **Passo 2.8: Verificar manualmente**

```bash
cd frontend && npm run typecheck && npm run dev
```

Expected:
- Desktop (≥900px): mesma topbar com itens visíveis; estado ativo igual; nenhum botão duplicado.
- Mobile (<900px): aparece ícone hambúrguer; drawer abre da direita; itens listados; tap fora fecha; cada item navega e fecha o drawer.
- Logado como admin → vê todos itens; logado como user → não vê Usuários/Aprovações/Auditoria.

- [ ] **Passo 2.9: Commit**

```bash
git add frontend/app/ui/NavConfig.ts frontend/app/ui/NavItem.tsx frontend/app/ui/AppShell.tsx frontend/app/ui/__tests__/NavConfig.test.ts frontend/app/root.tsx
git commit -m "refactor(ui): AppShell responsivo com nav declarativa e drawer mobile"
```

---

## Tarefa 3: PageHeader e PageSection primitives

**Files:**
- Create: `frontend/app/ui/PageHeader.tsx`
- Create: `frontend/app/ui/PageSection.tsx`
- Modify: `frontend/app/ui/index.ts` (re-export)
- Modify: `frontend/app/routes/environments.tsx` (rota piloto)

- [ ] **Passo 3.1: Criar `PageHeader.tsx`**

```tsx
// frontend/app/ui/PageHeader.tsx
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: Props) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{ mb: 3, alignItems: { md: "flex-end" }, justifyContent: "space-between" }}
    >
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" sx={{ color: "text.secondary", mt: 0.5, maxWidth: 640 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
```

- [ ] **Passo 3.2: Criar `PageSection.tsx`**

```tsx
// frontend/app/ui/PageSection.tsx
import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  padded?: boolean;
};

export function PageSection({ title, description, children, padded = true }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{ p: padded ? { xs: 2, md: 3 } : 0, mb: 3, borderRadius: 2, overflow: "hidden" }}
    >
      {(title || description) && (
        <Box sx={{ mb: 2 }}>
          {title && <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>}
          {description && <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>{description}</Typography>}
        </Box>
      )}
      {children}
    </Paper>
  );
}
```

- [ ] **Passo 3.3: Refatorar `environments.tsx` como piloto**

Em `frontend/app/routes/environments.tsx`, substituir o cabeçalho atual (linhas 43–59 aprox.) por:

```tsx
import { PageHeader, PageSection } from "~/app/ui";

<PageHeader
  title="Gestão de Ambientes"
  description="Cadastre, edite e pesquise ambientes disponíveis para reserva."
  actions={
    <>
      <Button startIcon={<SearchIcon />} variant="outlined" onClick={() => setOpenSearchDialog(true)}>
        Buscar
      </Button>
      {isAdmin && (
        <Button startIcon={<AddIcon />} variant="contained" onClick={openCreateDialog}>
          Novo ambiente
        </Button>
      )}
    </>
  }
/>
<PageSection padded={false}>
  <EnvironmentsTable ... />
</PageSection>
```

Atualizar `frontend/app/ui/index.ts` para incluir `export * from "./PageHeader"; export * from "./PageSection";`.

- [ ] **Passo 3.4: Verificar manualmente**

```bash
cd frontend && npm run typecheck && npm run dev
```

Expected: rota `/environments` mostra título, descrição abaixo, e botões alinhados à direita (desktop) ou empilhados (mobile). Tabela em card. Nenhuma quebra visual.

- [ ] **Passo 3.5: Commit**

```bash
git add frontend/app/ui/PageHeader.tsx frontend/app/ui/PageSection.tsx frontend/app/ui/index.ts frontend/app/routes/environments.tsx
git commit -m "feat(ui): adiciona PageHeader/PageSection e aplica em ambientes"
```

---

## Tarefa 4: useToast — sistema global de notificações

**Files:**
- Create: `frontend/app/ui/useToast.tsx`
- Create: `frontend/app/ui/__tests__/useToast.test.tsx`
- Modify: `frontend/app/root.tsx` (envolver com `<ToastProvider>`)

- [ ] **Passo 4.1: Escrever teste falhando**

```tsx
// frontend/app/ui/__tests__/useToast.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../useToast";

function Probe() {
  const toast = useToast();
  return <button onClick={() => toast.success("Salvo com sucesso")}>fire</button>;
}

describe("useToast", () => {
  it("exibe e remove toast após interação", async () => {
    render(<ToastProvider><Probe /></ToastProvider>);
    act(() => { screen.getByText("fire").click(); });
    expect(await screen.findByRole("status")).toHaveTextContent("Salvo com sucesso");
  });
});
```

- [ ] **Passo 4.2: Rodar teste — deve falhar**

```bash
cd frontend && npx vitest run app/ui/__tests__/useToast.test.tsx
```

Expected: FAIL (módulo inexistente). Se `@testing-library/react` não estiver instalado: `npm i -D @testing-library/react @testing-library/jest-dom jsdom` e configurar `vitest.config.ts` com `environment: "jsdom"`.

- [ ] **Passo 4.3: Implementar `useToast.tsx`**

```tsx
// frontend/app/ui/useToast.tsx
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Snackbar, Alert } from "@mui/material";

type Severity = "success" | "error" | "warning" | "info";
type ToastApi = {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  warning: (msg: string) => void;
  info:    (msg: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; msg: string; severity: Severity }>({
    open: false, msg: "", severity: "info",
  });

  const show = useCallback((severity: Severity) => (msg: string) => {
    setState({ open: true, msg, severity });
  }, []);

  const api = useMemo<ToastApi>(() => ({
    success: show("success"),
    error:   show("error"),
    warning: show("warning"),
    info:    show("info"),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={() => setState((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          role="status"
          severity={state.severity}
          variant="filled"
          onClose={() => setState((s) => ({ ...s, open: false }))}
          sx={{ minWidth: 280, boxShadow: 4 }}
        >
          {state.msg}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
```

- [ ] **Passo 4.4: Rodar teste — deve passar**

```bash
cd frontend && npx vitest run app/ui/__tests__/useToast.test.tsx
```

Expected: PASS.

- [ ] **Passo 4.5: Envolver app com `<ToastProvider>`**

Em `frontend/app/root.tsx`, dentro de `<ThemeProvider>` envolver `<LocalizationProvider>...</LocalizationProvider>` com `<ToastProvider>`.

- [ ] **Passo 4.6: Aplicar toast em `environments.tsx` (piloto)**

No `useEnvironmentsManagement`, ao salvar/excluir com sucesso chamar `toast.success("Ambiente salvo.")` e em catch `toast.error(err.message)`. Remover `Alert` inline que duplica esse papel se houver.

- [ ] **Passo 4.7: Verificar manualmente + commit**

```bash
cd frontend && npm run dev
```

Expected: ao criar/editar ambiente, toast verde aparece no canto inferior direito por ~4s; ao falhar, toast vermelho com mensagem.

```bash
git add frontend/app/ui/useToast.tsx frontend/app/ui/__tests__/useToast.test.tsx frontend/app/ui/index.ts frontend/app/root.tsx frontend/app/routes/environments.tsx frontend/app/routes/environments/use-environments-management.tsx
git commit -m "feat(ui): adiciona ToastProvider/useToast e aplica em ambientes"
```

---

## Tarefa 5: DataTable + skeleton + empty state

**Files:**
- Create: `frontend/app/ui/StatusChip.tsx`
- Create: `frontend/app/ui/EmptyState.tsx`
- Create: `frontend/app/ui/TableSkeleton.tsx`
- Create: `frontend/app/ui/DataTable.tsx`
- Create: `frontend/app/ui/__tests__/DataTable.test.tsx`
- Modify: `frontend/app/routes/environments/environments-table.tsx` (piloto)

- [ ] **Passo 5.1: Escrever teste falhando**

```tsx
// frontend/app/ui/__tests__/DataTable.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "../DataTable";

const cols = [{ key: "name", header: "Nome", cell: (r: { name: string }) => r.name }];

describe("DataTable", () => {
  it("mostra skeleton quando loading=true", () => {
    render(<DataTable columns={cols} rows={[]} loading getRowKey={(r) => r.name} />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("mostra empty state quando vazio e sem loading", () => {
    render(<DataTable columns={cols} rows={[]} loading={false} emptyTitle="Vazio" emptyDescription="Sem dados" getRowKey={(r) => r.name} />);
    expect(screen.getByText("Vazio")).toBeInTheDocument();
    expect(screen.getByText("Sem dados")).toBeInTheDocument();
  });

  it("renderiza linhas", () => {
    render(<DataTable columns={cols} rows={[{ name: "Sala A" }, { name: "Sala B" }]} loading={false} getRowKey={(r) => r.name} />);
    expect(screen.getByText("Sala A")).toBeInTheDocument();
    expect(screen.getByText("Sala B")).toBeInTheDocument();
  });
});
```

- [ ] **Passo 5.2: Rodar teste — deve falhar**

```bash
cd frontend && npx vitest run app/ui/__tests__/DataTable.test.tsx
```

Expected: FAIL (módulo inexistente).

- [ ] **Passo 5.3: Criar `EmptyState.tsx`**

```tsx
// frontend/app/ui/EmptyState.tsx
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import InboxIcon from "@mui/icons-material/Inbox";

type Props = { title: string; description?: string; icon?: ReactNode; action?: ReactNode };

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 6, color: "text.secondary", textAlign: "center" }}>
      <Box sx={{ fontSize: 48, color: "text.disabled" }}>{icon ?? <InboxIcon fontSize="inherit" />}</Box>
      <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700 }}>{title}</Typography>
      {description && <Typography variant="body2" sx={{ maxWidth: 420 }}>{description}</Typography>}
      {action}
    </Stack>
  );
}
```

- [ ] **Passo 5.4: Criar `TableSkeleton.tsx`**

```tsx
// frontend/app/ui/TableSkeleton.tsx
import { Skeleton, Stack } from "@mui/material";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack spacing={1.5} data-testid="table-skeleton" sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={44} />
      ))}
    </Stack>
  );
}
```

- [ ] **Passo 5.5: Criar `StatusChip.tsx`**

```tsx
// frontend/app/ui/StatusChip.tsx
import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";
const COLOR_BY_TONE: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: "#dff0e8", fg: "#1f6f5f" },
  warning: { bg: "#fce6d4", fg: "#8b4721" },
  danger:  { bg: "#fadcdc", fg: "#9b2c2c" },
  info:    { bg: "#dde9f5", fg: "#2c5a8a" },
  neutral: { bg: "#e6ebe9", fg: "#4f665f" },
};

export function StatusChip({ tone, label, size = "small", ...rest }: { tone: Tone; label: string } & Omit<ChipProps, "color">) {
  const c = COLOR_BY_TONE[tone];
  return <Chip size={size} label={label} sx={{ backgroundColor: c.bg, color: c.fg, fontWeight: 600 }} {...rest} />;
}
```

- [ ] **Passo 5.6: Criar `DataTable.tsx`**

```tsx
// frontend/app/ui/DataTable.tsx
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { TableSkeleton } from "./TableSkeleton";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: number | string;
  align?: "left" | "right" | "center";
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  getRowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({ columns, rows, loading, emptyTitle = "Nada por aqui", emptyDescription, emptyAction, getRowKey, onRowClick }: Props<T>) {
  if (loading) return <TableSkeleton />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;

  return (
    <TableContainer>
      <Table size="medium">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key} align={c.align ?? "left"} sx={{ width: c.width }}>
                {c.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={getRowKey(row)}
              hover
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              sx={{ cursor: onRowClick ? "pointer" : "default" }}
            >
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align ?? "left"}>{c.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

- [ ] **Passo 5.7: Rodar teste — deve passar**

```bash
cd frontend && npx vitest run app/ui/__tests__/DataTable.test.tsx
```

Expected: PASS.

- [ ] **Passo 5.8: Migrar `environments-table.tsx` para `DataTable`**

Substituir o `<Table>` manual em `frontend/app/routes/environments/environments-table.tsx` por:

```tsx
import { DataTable, type Column } from "~/app/ui";
import type { Environment } from "~/app/services/api";

const columns: Column<Environment>[] = [
  { key: "name",     header: "Nome",       cell: (e) => e.name },
  { key: "type",     header: "Tipo",       cell: (e) => e.type },
  { key: "capacity", header: "Capacidade", cell: (e) => e.capacity, align: "right" },
  { key: "actions",  header: "",           cell: (e) => /* botões editar/excluir */ null, width: 120, align: "right" },
];

<DataTable
  columns={columns}
  rows={environments}
  loading={loading}
  getRowKey={(e) => e.id}
  emptyTitle="Nenhum ambiente cadastrado"
  emptyDescription="Crie o primeiro ambiente para começar a permitir reservas."
  emptyAction={isAdmin ? <Button variant="contained" onClick={openCreateDialog}>Novo ambiente</Button> : null}
/>
```

- [ ] **Passo 5.9: Verificar manualmente + commit**

Expected na rota `/environments`:
- Durante o fetch inicial, aparece skeleton em vez de spinner único.
- Lista vazia mostra ícone + título + descrição + botão "Novo ambiente" (se admin).
- Linhas com dados renderizam normalmente.

```bash
git add frontend/app/ui/EmptyState.tsx frontend/app/ui/TableSkeleton.tsx frontend/app/ui/StatusChip.tsx frontend/app/ui/DataTable.tsx frontend/app/ui/__tests__/DataTable.test.tsx frontend/app/ui/index.ts frontend/app/routes/environments/environments-table.tsx
git commit -m "feat(ui): DataTable com skeleton, empty state e StatusChip"
```

---

## Tarefa 6: FormDialog responsivo + FormField

**Files:**
- Create: `frontend/app/ui/FormDialog.tsx`
- Create: `frontend/app/ui/FormField.tsx`
- Create: `frontend/app/ui/ConfirmDialog.tsx`
- Modify: `frontend/app/routes/environments/environment-form-dialog.tsx` (piloto)

- [ ] **Passo 6.1: Criar `FormDialog.tsx`**

```tsx
// frontend/app/ui/FormDialog.tsx
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, useMediaQuery, useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitting?: boolean;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg";
};

export function FormDialog({
  open, title, onClose, onSubmit, submitLabel = "Salvar", submitting, children, maxWidth = "sm",
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box component="span" sx={{ fontWeight: 700 }}>{title}</Box>
        <IconButton aria-label="Fechar" onClick={onClose} disabled={submitting}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        {onSubmit && (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Passo 6.2: Criar `FormField.tsx`**

```tsx
// frontend/app/ui/FormField.tsx
import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";

type Props = TextFieldProps & { helper?: string; error?: string };

export function FormField({ helper, error, ...props }: Props) {
  return (
    <TextField
      fullWidth
      margin="dense"
      InputLabelProps={{ shrink: true }}
      helperText={error || helper}
      error={Boolean(error)}
      {...props}
    />
  );
}
```

- [ ] **Passo 6.3: Criar `ConfirmDialog.tsx`**

```tsx
// frontend/app/ui/ConfirmDialog.tsx
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", destructive, onConfirm, onCancel,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent><DialogContentText>{description}</DialogContentText></DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button
          variant="contained"
          color={destructive ? "error" : "primary"}
          onClick={onConfirm}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Passo 6.4: Migrar `environment-form-dialog.tsx`**

Substituir o `<Dialog>` manual por `<FormDialog title="Novo ambiente" ...>`; trocar `TextField`s por `FormField`; usar `<ConfirmDialog>` quando excluir.

- [ ] **Passo 6.5: Verificar manualmente + commit**

Expected:
- Em mobile (<600px): dialog ocupa tela toda.
- Botão "Salvar" mostra spinner durante submit; cancel desabilitado durante submit.
- Erro de validação aparece abaixo do campo correspondente, em vermelho.
- Excluir ambiente abre confirmação destacada em vermelho.

```bash
git add frontend/app/ui/FormDialog.tsx frontend/app/ui/FormField.tsx frontend/app/ui/ConfirmDialog.tsx frontend/app/ui/index.ts frontend/app/routes/environments/environment-form-dialog.tsx
git commit -m "feat(ui): FormDialog responsivo, FormField e ConfirmDialog destrutivo"
```

---

## Tarefa 7: Command Palette (Ctrl/Cmd+K) para navegação global

**Files:**
- Create: `frontend/app/ui/CommandPalette.tsx`
- Create: `frontend/app/ui/__tests__/CommandPalette.test.tsx`
- Modify: `frontend/app/ui/AppShell.tsx` (atalho + botão "Buscar (⌘K)")

- [ ] **Passo 7.1: Escrever teste falhando — filtragem fuzzy simples**

```tsx
// frontend/app/ui/__tests__/CommandPalette.test.tsx
import { describe, expect, it } from "vitest";
import { filterCommands } from "../CommandPalette";

describe("filterCommands", () => {
  const all = [
    { label: "Reservas",   path: "/reservas"   },
    { label: "Ambientes",  path: "/environments" },
    { label: "Auditoria",  path: "/auditoria"  },
  ];

  it("retorna todos quando query vazia", () => {
    expect(filterCommands(all, "")).toHaveLength(3);
  });

  it("filtra case-insensitive por substring", () => {
    expect(filterCommands(all, "amb").map(c => c.label)).toEqual(["Ambientes"]);
  });

  it("normaliza acentos", () => {
    expect(filterCommands(all, "auditoria").map(c => c.label)).toEqual(["Auditoria"]);
    expect(filterCommands(all, "auditória").map(c => c.label)).toEqual(["Auditoria"]);
  });
});
```

- [ ] **Passo 7.2: Rodar teste — deve falhar**

```bash
cd frontend && npx vitest run app/ui/__tests__/CommandPalette.test.tsx
```

Expected: FAIL.

- [ ] **Passo 7.3: Implementar `CommandPalette.tsx`**

```tsx
// frontend/app/ui/CommandPalette.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, InputBase, List, ListItemButton, ListItemText, Box, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router";
import { filterNavForRoles } from "./NavConfig";

export type Command = { label: string; path: string };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filterCommands(commands: Command[], query: string): Command[] {
  const q = norm(query.trim());
  if (!q) return commands;
  return commands.filter((c) => norm(c.label).includes(q) || norm(c.path).includes(q));
}

type Props = { open: boolean; onClose: () => void; isAuthenticated: boolean; roles: string[] };

export function CommandPalette({ open, onClose, isAuthenticated, roles }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const commands = useMemo<Command[]>(
    () => filterNavForRoles(roles, isAuthenticated).map((i) => ({ label: i.label, path: i.path })),
    [roles, isAuthenticated],
  );
  const filtered = useMemo(() => filterCommands(commands, query), [commands, query]);

  useEffect(() => { setQuery(""); setHighlight(0); }, [open]);
  useEffect(() => { setHighlight(0); }, [query]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter") {
      const target = filtered[highlight];
      if (target) { navigate(target.path); onClose(); }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, mt: 8, alignSelf: "flex-start" } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <SearchIcon color="action" />
        <InputBase
          autoFocus
          fullWidth
          placeholder="Ir para…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          inputProps={{ "aria-label": "Buscar página" }}
        />
      </Box>
      <List sx={{ maxHeight: 320, overflow: "auto", py: 0 }}>
        {filtered.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            <Typography>Nada encontrado.</Typography>
          </Box>
        )}
        {filtered.map((c, idx) => (
          <ListItemButton
            key={c.path}
            selected={idx === highlight}
            onMouseEnter={() => setHighlight(idx)}
            onClick={() => { navigate(c.path); onClose(); }}
            sx={{ minHeight: 48 }}
          >
            <ListItemText primary={c.label} secondary={c.path} />
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  );
}
```

- [ ] **Passo 7.4: Rodar teste — deve passar**

```bash
cd frontend && npx vitest run app/ui/__tests__/CommandPalette.test.tsx
```

Expected: PASS.

- [ ] **Passo 7.5: Integrar em `AppShell.tsx`**

Adicionar estado `paletteOpen`, listener global, e botão "Buscar (⌘K)" no lugar do hambúrguer em desktop quando autenticado:

```tsx
const [paletteOpen, setPaletteOpen] = useState(false);

useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setPaletteOpen(true);
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);

// no JSX, antes do logout:
{isAuthenticated && !isMobile && (
  <Button variant="text" startIcon={<SearchIcon />} onClick={() => setPaletteOpen(true)} sx={{ color: "text.secondary" }}>
    Buscar <Box component="kbd" sx={{ ml: 1, px: 0.75, py: 0.25, borderRadius: 1, border: "1px solid", borderColor: "divider", fontSize: 12 }}>⌘K</Box>
  </Button>
)}
<CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} isAuthenticated={isAuthenticated} roles={roles} />
```

- [ ] **Passo 7.6: Verificar manualmente + commit**

Expected:
- Ctrl+K (Linux/Win) / Cmd+K (Mac) abre o palette de qualquer lugar.
- Digitar filtra; setas navegam; Enter navega para item.
- Acento "auditória" encontra "Auditoria".
- Esc fecha; clique fora fecha.

```bash
git add frontend/app/ui/CommandPalette.tsx frontend/app/ui/__tests__/CommandPalette.test.tsx frontend/app/ui/AppShell.tsx
git commit -m "feat(ui): adiciona Command Palette (Ctrl/Cmd+K) para navegação"
```

---

## Tarefa 8: Padronizar rotas restantes (rolling refactor)

> Esta tarefa repete o padrão das Tarefas 3–6 em cada rota. Faça uma rota por commit para revisão fácil.

**Files:**
- Modify: `frontend/app/routes/resources.tsx`
- Modify: `frontend/app/routes/purposes.tsx`
- Modify: `frontend/app/routes/organizational-units.tsx`
- Modify: `frontend/app/routes/qualifications.tsx`
- Modify: `frontend/app/routes/users.tsx`
- Modify: `frontend/app/routes/calendar-blocks.tsx`
- Modify: `frontend/app/routes/incidents.tsx`
- Modify: `frontend/app/routes/penalties.tsx`
- Modify: `frontend/app/routes/approvals.tsx`
- Modify: `frontend/app/routes/audit.tsx`

Para **cada** rota acima, repetir os passos:

- [ ] **Passo 8.x.1: Substituir cabeçalho por `<PageHeader>`** (título igual ao atual; descrição curta em pt-BR; ações no slot `actions`).

- [ ] **Passo 8.x.2: Envolver área principal em `<PageSection>` (`padded={false}` quando contém tabela).**

- [ ] **Passo 8.x.3: Substituir `<Table>` manual por `<DataTable>` com `columns`, `loading`, `emptyTitle/emptyDescription/emptyAction`.**

- [ ] **Passo 8.x.4: Substituir `Dialog` de formulário por `<FormDialog>`; campos por `<FormField>`; confirmações destrutivas por `<ConfirmDialog>`.**

- [ ] **Passo 8.x.5: Trocar `Alert` inline de sucesso/erro por `useToast()`.**

- [ ] **Passo 8.x.6: Usar `<StatusChip tone="...">` para colunas/badges de status.** Mapear cada `*Status` do `services/api.ts` para um tone:
  - APPROVED / COMPLETED / RETURNED → `success`
  - PENDING_APPROVAL / PENDING / UNDER_REVIEW / SUBMITTED → `info`
  - PRE_BLOCKED / WARNING / OVERDUE / EXPIRED → `warning`
  - REJECTED / CANCELLED / NO_SHOW / LOST / DAMAGE → `danger`
  - DRAFT / IN_USE / outros neutros → `neutral`

- [ ] **Passo 8.x.7: Verificar manualmente na rota.**

- [ ] **Passo 8.x.8: Commit por rota.**

```bash
git add frontend/app/routes/<rota>.tsx
git commit -m "refactor(<rota>): aplica PageHeader/DataTable/Toast"
```

> **Excluído desta tarefa:** `reservations.tsx` (Tarefa 9) e `home.tsx` (Tarefa 11). Não tocar arquivos sob `routes/environments/` (já piloto).

---

## Tarefa 9: Quebrar `reservations.tsx` (1438 linhas) em componentes

**Files:**
- Create: `frontend/app/routes/reservations/use-reservations.tsx` (hook estado + chamadas API)
- Create: `frontend/app/routes/reservations/reservations-calendar.tsx`
- Create: `frontend/app/routes/reservations/reservations-list.tsx`
- Create: `frontend/app/routes/reservations/reservation-form-dialog.tsx`
- Create: `frontend/app/routes/reservations/reservation-conflicts-alert.tsx`
- Create: `frontend/app/routes/reservations/status-tone.ts`
- Modify: `frontend/app/routes/reservations.tsx` (vira shell de ~80 linhas)

- [ ] **Passo 9.1: Mapear seções**

Antes de mover qualquer linha, abrir `reservations.tsx` e anotar (em comentário no PR ou em arquivo `MOVE_PLAN.md` temporário) as faixas que serão movidas: STATUS_LABEL, helpers, hook de estado, calendário, lista, dialogo de criação, dialogo de conflitos.

- [ ] **Passo 9.2: Extrair `status-tone.ts`**

Mover os mapas `STATUS_LABEL`, `STATUS_TONE` (e equivalentes para purpose/type) para `status-tone.ts`; importar de volta.

```bash
git add frontend/app/routes/reservations/status-tone.ts frontend/app/routes/reservations.tsx
git commit -m "refactor(reservas): extrai status-tone"
```

- [ ] **Passo 9.3: Extrair `use-reservations.tsx` (hook)**

Mover todo `useState`/`useEffect`/`useMemo` relacionado a estado de reservas + chamadas API para o hook; rota consome `const { ... } = useReservations()`.

Verificar `npm run dev` — comportamento idêntico. Commit.

- [ ] **Passo 9.4: Extrair `reservation-form-dialog.tsx`**

Mover o `<Dialog>` de criação/edição para componente próprio, recebendo `open`, `onClose`, `onSubmit`, dados auxiliares (rooms, resources, users) via props. Trocar `Dialog` por `FormDialog` da Tarefa 6.

Commit.

- [ ] **Passo 9.5: Extrair `reservations-calendar.tsx` e `reservations-list.tsx`**

Mover `DateCalendar` + dia selecionado para `reservations-calendar.tsx`; mover lista/tabela diária para `reservations-list.tsx` (usando `DataTable`).

Commit.

- [ ] **Passo 9.6: Extrair `reservation-conflicts-alert.tsx`**

Mover o bloco que renderiza `ReservationConflictError` para componente próprio, reutilizando `Alert` + lista de conflitos com detalhes.

Commit.

- [ ] **Passo 9.7: Verificar manualmente**

Expected: rota `/reservas` se comporta exatamente como antes; criar reserva, ver conflito, cancelar, mudar dia no calendário, alternar lista — todos funcionam. Tamanho de `reservations.tsx` cai para <200 linhas.

```bash
wc -l frontend/app/routes/reservations.tsx frontend/app/routes/reservations/*.tsx
```

---

## Tarefa 10: Passe de acessibilidade e teclado

**Files:**
- Modify: `frontend/app/ui/theme.ts` (focus ring global)
- Modify: `frontend/app/app.css` (skip link)
- Modify: `frontend/app/root.tsx` (id="main" no `<main>`, skip link)

- [ ] **Passo 10.1: Skip link**

Em `app.css`:

```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  padding: 8px 12px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  z-index: 1500;
}
.skip-link:focus { left: 8px; }
```

Em `root.tsx`, dentro de `<body>` antes do conteúdo:

```tsx
<a className="skip-link" href="#main">Pular para o conteúdo</a>
```

E adicionar `id="main"` no `<Box component="main">`.

- [ ] **Passo 10.2: Auditoria manual de teclado**

Para cada rota principal (`/reservas`, `/environments`, `/aprovacoes`, `/users`):
- [ ] Tab navega por todos os controles na ordem visual.
- [ ] Foco sempre visível (anel de 2px primário).
- [ ] Enter ativa botões; Space ativa botões/checkboxes; Esc fecha modais.
- [ ] Em `DataTable` com `onRowClick`, a linha é focável (`tabIndex={0}`) e Enter dispara o clique.

Para corrigir o último item, em `DataTable.tsx`:

```tsx
<TableRow
  key={getRowKey(row)}
  hover
  tabIndex={onRowClick ? 0 : -1}
  onClick={onRowClick ? () => onRowClick(row) : undefined}
  onKeyDown={onRowClick ? (e) => { if (e.key === "Enter") onRowClick(row); } : undefined}
  sx={{ cursor: onRowClick ? "pointer" : "default" }}
>
```

- [ ] **Passo 10.3: aria-label em IconButton**

Verificar com:

```bash
grep -rn "<IconButton" frontend/app/routes frontend/app/ui | grep -v "aria-label"
```

Expected: lista vazia (ou apenas IconButtons sem ação navegável). Para cada caso restante, adicionar `aria-label="..."`.

- [ ] **Passo 10.4: Contraste**

Validar visualmente em DevTools que body text (`#17322d` sobre `#f3f5ef`) e secondary text (`#4f665f` sobre `#ffffff`) passam de 4.5:1. Já passam pela paleta atual — apenas confirmar.

- [ ] **Passo 10.5: Commit**

```bash
git add frontend/app/ui/DataTable.tsx frontend/app/app.css frontend/app/root.tsx
git commit -m "a11y: skip link, foco em linhas de tabela e foco visível global"
```

---

## Tarefa 11: Home page — re-priorizar conteúdo logado

**Files:**
- Modify: `frontend/app/routes/home.tsx`

Hoje a Home é hero estático mesmo para usuário logado. Para logado, mostrar atalhos diretos (Reservas, Aprovações pendentes, Próximos eventos) em vez de hero promocional.

- [ ] **Passo 11.1: Branch lógica em `home.tsx`**

```tsx
return isAuthenticated ? <HomeLoggedIn isAdmin={isAdmin} /> : <HomeMarketing />;
```

- [ ] **Passo 11.2: Componente `HomeLoggedIn`**

Grid de 3–4 cards (`PageSection` ou cards customizados) com:
- "Minhas reservas" → `/reservas` (mostra contagem do dia se disponível via API).
- "Aprovações pendentes" → `/aprovacoes` (apenas admin/manager).
- "Ambientes" → `/environments`.
- "Buscar (⌘K)" → abre command palette via callback.

Cada card: ícone + título + subtítulo + chevron à direita, `minHeight: 120`, press-feedback (scale 0.97 em :active — herdado do tema).

- [ ] **Passo 11.3: Verificar manualmente**

Expected: logado vê dashboard de atalhos; deslogado vê página marketing existente.

- [ ] **Passo 11.4: Commit**

```bash
git add frontend/app/routes/home.tsx
git commit -m "feat(home): atalhos para usuários autenticados"
```

---

## Tarefa 12: Pré-entrega — checklist de qualidade

**Files:** nenhuma criação; apenas validação.

- [ ] **Passo 12.1: Lint + typecheck**

```bash
cd frontend && npm run typecheck && npm run lint
```

Expected: zero erros.

- [ ] **Passo 12.2: Build**

```bash
cd frontend && npm run build
```

Expected: build OK; bundles dentro do esperado (verificar diff em chunks).

- [ ] **Passo 12.3: Testes**

```bash
cd frontend && npx vitest run
```

Expected: todos os testes passam (`NavConfig`, `useToast`, `DataTable`, `CommandPalette`).

- [ ] **Passo 12.4: Visual sweep — golden paths**

Rodar `npm run dev`, percorrer manualmente:

- [ ] Login → home dashboard (logado) → Reservas (criar uma) → Aprovações (aprovar) → Ambientes (criar/editar/excluir) → Buscar com ⌘K → Sair.
- [ ] Mobile 375px: topbar mostra hambúrguer; drawer abre; formulários em full-screen; tabelas sem horizontal scroll (ou com scroll consciente dentro do card).
- [ ] Reduced motion: ativar em DevTools → confirmar que `page-enter` reduz; sem animações longas.
- [ ] Empty states em todas as rotas (forçar via filtro impossível ou base vazia).

- [ ] **Passo 12.5: Commit final + tag**

Se houver ajustes pequenos, commitar:

```bash
git add -A
git commit -m "chore(ui): ajustes finais pós-sweep"
```

(Não fazer push automático — usuário decide.)

---

## Cobertura vs. ui-ux-pro-max Quick Reference

| Categoria | Onde é endereçada |
|---|---|
| §1 Acessibilidade (CRITICAL) | Tarefa 1 (focus-visible global), Tarefa 10 (skip link, aria-labels, teclado), Tarefa 4 (`role="status"` em toast) |
| §2 Toque/Interação (CRITICAL) | Tarefa 1 (`minHeight: 44` em Button/IconButton), Tarefa 4 (loading-buttons via toast + submitting), Tarefa 6 (botões com spinner durante submit) |
| §3 Performance (HIGH) | Tarefa 5 (skeleton em vez de spinner), Tarefa 9 (split de route gigante; reduz bundle por rota) |
| §4 Estilo (HIGH) | Tarefa 1 (tokens), Tarefa 5 (StatusChip semântico), Tarefa 3 (consistência via PageHeader/PageSection) |
| §5 Layout (HIGH) | Tarefa 2 (adaptive-navigation), Tarefa 6 (FormDialog full-screen em mobile), Tarefa 8 (passe responsivo) |
| §6 Tipografia/Cor (MEDIUM) | Tarefa 1 (semantic tokens), Tarefa 10 (contraste) |
| §7 Animação (MEDIUM) | Tarefa 1 (duration/easing tokens), Tarefa 10 (reduced-motion já existente preservado) |
| §8 Forms (MEDIUM) | Tarefa 6 (FormField helper/error, FormDialog, ConfirmDialog), Tarefa 4 (success-feedback via toast) |
| §9 Navegação (HIGH) | Tarefa 2 (AppShell adaptativo, `aria-current`), Tarefa 7 (command palette) |
| §10 Charts/Data (LOW) | Não há gráficos no projeto hoje — fora de escopo |

---

## Self-review

- **Cobertura do spec ("UX do projeto inteiro")**: todas as 14 rotas estão endereçadas (env piloto na T3–6; 10 rotas na T8; reservas na T9; home na T11; 404 e login/register sem mudanças porque já são simples e específicos).
- **Placeholders**: nenhum "TODO/TBD"; todo código é completo e plug-and-play; as ações destrutivas e validações vêm com snippet pronto.
- **Consistência de tipos**: `filterNavForRoles(roles, isAuthenticated)` usa a mesma assinatura no teste, no componente NavConfig, no AppShell e no CommandPalette. `DataTable<T>` tem `getRowKey` obrigatório em todas as chamadas. `useToast()` retorna `success/error/warning/info` (assinatura única).
- **Riscos**: a Tarefa 9 (quebra de `reservations.tsx`) é a mais arriscada; mitigado fazendo um sub-passo por commit com verificação manual. Caso queira pular essa tarefa no primeiro ciclo, ela pode ser adiada — os ganhos das Tarefas 1–8 são independentes.
