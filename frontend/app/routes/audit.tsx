import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import dayjs, { type Dayjs } from "dayjs";

import {
  auditApi,
  clearAuthTokens,
  hasValidAccessToken,
  userApi,
} from "../services/api";
import type { AuditAction, AuditRecord, User } from "../services/api";

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  APPROVE: "Aprovação",
  REJECT: "Rejeição",
  CANCEL: "Cancelamento",
  CHECKIN: "Check-in",
  CHECKOUT: "Check-out",
  ASSIGN_RESOURCE: "Atribuição de recurso",
  REMOVE_RESOURCE: "Remoção de recurso",
};

const ACTION_COLORS: Record<
  AuditAction,
  "success" | "info" | "error" | "warning" | "default"
> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "error",
  APPROVE: "success",
  REJECT: "error",
  CANCEL: "warning",
  CHECKIN: "info",
  CHECKOUT: "info",
  ASSIGN_RESOURCE: "default",
  REMOVE_RESOURCE: "warning",
};

const AUDIT_ACTIONS: AuditAction[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
  "CANCEL",
  "CHECKIN",
  "CHECKOUT",
  "ASSIGN_RESOURCE",
  "REMOVE_RESOURCE",
];

interface Filters {
  entity_type: string;
  target_id: string;
  action: AuditAction | "";
  start: Dayjs | null;
  end: Dayjs | null;
}

const emptyFilters = (): Filters => ({
  entity_type: "",
  target_id: "",
  action: "",
  start: null,
  end: null,
});

const prettyJson = (raw: string | null): string => {
  if (raw === null || raw === undefined) return "(vazio)";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

export default function AuditPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [diffTarget, setDiffTarget] = useState<AuditRecord | null>(null);

  const handleAuthError = (message: string): boolean => {
    if (
      message.includes("Sua sessão expirou") ||
      message.includes("Could not validate credentials") ||
      message.includes("Token expired")
    ) {
      clearAuthTokens();
      navigate("/login");
      return true;
    }
    return false;
  };

  const fetchRecords = async (f: Filters) => {
    setLoading(true);
    setError("");
    try {
      const data = await auditApi.list({
        entity_type: f.entity_type || undefined,
        target_id: f.target_id ? Number(f.target_id) : undefined,
        action: f.action || undefined,
        start: f.start ? f.start.toISOString() : undefined,
        end: f.end ? f.end.toISOString() : undefined,
        limit: 100,
      });
      setRecords(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao consultar auditoria";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasValidAccessToken()) {
      navigate("/login");
      return;
    }
    const bootstrap = async () => {
      try {
        const [allUsers, initialRecords] = await Promise.all([
          userApi.getAllUsers(0, 500),
          auditApi.list({ limit: 100 }),
        ]);
        setUsers(allUsers);
        setRecords(initialRecords);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao carregar dados";
        if (!handleAuthError(message)) setError(message);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [navigate]);

  const handleFilter = () => {
    fetchRecords(filters);
  };

  const handleClear = () => {
    const cleared = emptyFilters();
    setFilters(cleared);
    fetchRecords(cleared);
  };

  const getUserEmail = (id: number): string =>
    users.find((u) => u.id === id)?.email ?? `Usuário #${id}`;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
            Auditoria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Histórico de ações realizadas no sistema
          </Typography>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 2,
          }}
        >
          <TextField
            label="Tipo de entidade"
            size="small"
            value={filters.entity_type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, entity_type: e.target.value }))
            }
            placeholder="ex: reservation"
          />
          <TextField
            label="ID alvo"
            size="small"
            type="number"
            value={filters.target_id}
            onChange={(e) =>
              setFilters((f) => ({ ...f, target_id: e.target.value }))
            }
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <Select
            size="small"
            displayEmpty
            value={filters.action}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                action: e.target.value as AuditAction | "",
              }))
            }
          >
            <MenuItem value="">
              <em>Todas as ações</em>
            </MenuItem>
            {AUDIT_ACTIONS.map((a) => (
              <MenuItem key={a} value={a}>
                {ACTION_LABELS[a]}
              </MenuItem>
            ))}
          </Select>
          <DateTimePicker
            label="Início"
            value={filters.start}
            onChange={(v) => setFilters((f) => ({ ...f, start: v }))}
            slotProps={{ textField: { size: "small" } }}
          />
          <DateTimePicker
            label="Término"
            value={filters.end}
            onChange={(v) => setFilters((f) => ({ ...f, end: v }))}
            slotProps={{ textField: { size: "small" } }}
          />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<FilterListIcon />}
              onClick={handleFilter}
              disabled={loading}
              sx={{ flexShrink: 0 }}
            >
              Filtrar
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              disabled={loading}
              color="inherit"
              sx={{ borderColor: "rgba(31, 111, 95, 0.3)", flexShrink: 0 }}
            >
              Limpar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : records.length === 0 ? (
        <Alert severity="info">Nenhum registro de auditoria encontrado.</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quando</TableCell>
                  <TableCell>Entidade</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Ação</TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell align="center">Detalhes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r, index) => (
                  <TableRow
                    key={r.id}
                    sx={{
                      animation: `fadeUp 240ms cubic-bezier(0.23, 1, 0.32, 1) both`,
                      animationDelay: `${Math.min(index, 6) * 40}ms`,
                      "@keyframes fadeUp": {
                        from: { opacity: 0, transform: "translateY(6px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                      },
                      "@media (prefers-reduced-motion: reduce)": {
                        animation: "none",
                      },
                    }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {dayjs(r.performed_at).format("DD/MM/YYYY HH:mm:ss")}
                    </TableCell>
                    <TableCell>{r.entity_type}</TableCell>
                    <TableCell>{r.target_id}</TableCell>
                    <TableCell>
                      <Chip
                        label={ACTION_LABELS[r.action] ?? r.action}
                        color={ACTION_COLORS[r.action] ?? "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getUserEmail(r.performed_by)}</TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => setDiffTarget(r)}
                        sx={{
                          borderColor: "rgba(31, 111, 95, 0.3)",
                          color: "text.primary",
                        }}
                      >
                        Ver diff
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Diff Dialog */}
      <Dialog
        open={Boolean(diffTarget)}
        onClose={() => setDiffTarget(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Versão — {diffTarget ? ACTION_LABELS[diffTarget.action] : ""}
          {diffTarget && (
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              ({diffTarget.entity_type} #{diffTarget.target_id})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {diffTarget && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                >
                  Estado anterior
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, bgcolor: "rgba(0,0,0,0.02)" }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {prettyJson(diffTarget.before_state)}
                  </pre>
                </Paper>
              </Box>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                >
                  Estado posterior
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, bgcolor: "rgba(0,0,0,0.02)" }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {prettyJson(diffTarget.after_state)}
                  </pre>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDiffTarget(null)} color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
