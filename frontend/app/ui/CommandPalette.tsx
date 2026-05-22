// frontend/app/ui/CommandPalette.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, InputBase, List, ListItemButton, ListItemText, Box, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router";
import { filterNavForRoles } from "./NavConfig";

export type Command = { label: string; path: string };

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-label="Paleta de comandos"
      slotProps={{ paper: { sx: { borderRadius: 3, mt: 8, alignSelf: "flex-start" } } }}
    >
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
      <List role="listbox" aria-label="Sugestões" sx={{ maxHeight: 320, overflow: "auto", py: 0 }}>
        {filtered.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            <Typography>Nada encontrado.</Typography>
          </Box>
        )}
        {filtered.map((c, idx) => (
          <ListItemButton
            key={c.path}
            role="option"
            aria-selected={idx === highlight}
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
