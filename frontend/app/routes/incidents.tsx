import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import dayjs from "dayjs";

import {
  clearAuthTokens,
  hasValidAccessToken,
  incidentApi,
  reservationApi,
  userApi,
} from "../services/api";
import type {
  Incident,
  IncidentCreate,
  IncidentSeverity,
  Reservation,
  User,
} from "../services/api";

const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const SEVERITY_COLOR: Record<IncidentSeverity, "default" | "warning" | "error"> = {
  LOW: "default",
  MEDIUM: "warning",
  HIGH: "error",
  CRITICAL: "error",
};

const SEVERITY_VALUES: IncidentSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function IncidentsPage() {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filter by reservation
  const [filterReservation, setFilterReservation] = useState<Reservation | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createReservation, setCreateReservation] = useState<Reservation | null>(null);
  const [createDescription, setCreateDescription] = useState("");
  const [createSeverity, setCreateSeverity] = useState<IncidentSeverity>("LOW");
  const [submitting, setSubmitting] = useState(false);

  const isStaff =
    currentUser?.roles.includes("admin") ||
    currentUser?.roles.includes("manager") ||
    currentUser?.roles.includes("technician");

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

  const loadIncidents = async (reservationId?: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await incidentApi.list(reservationId);
      setIncidents(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao listar incidentes";
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
        const [reservs, me] = await Promise.all([
          reservationApi.list({ limit: 500 }),
          userApi.getCurrentUser(),
        ]);
        setReservations(reservs);
        setCurrentUser(me);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao carregar dados auxiliares";
        if (!handleAuthError(message)) setError(message);
      }
    };
    bootstrap();
    loadIncidents();
  }, [navigate]);

  const handleFilterChange = (reservation: Reservation | null) => {
    setFilterReservation(reservation);
    loadIncidents(reservation?.id);
  };

  const openCreate = () => {
    setCreateReservation(null);
    setCreateDescription("");
    setCreateSeverity("LOW");
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (submitting) return;
    setCreateOpen(false);
    setCreateReservation(null);
    setCreateDescription("");
    setCreateSeverity("LOW");
  };

  const handleCreate = async () => {
    if (!createReservation || !createDescription.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const payload: IncidentCreate = {
        reservation_id: createReservation.id,
        description: createDescription.trim(),
        severity: createSeverity,
      };
      await incidentApi.create(payload);
      setSuccessMessage("Incidente registrado com sucesso.");
      closeCreate();
      await loadIncidents(filterReservation?.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao registrar incidente";
      if (!handleAuthError(message)) setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const createFormValid = !!createReservation && !!createDescription.trim();

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
            Incidentes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Ocorrências registradas em reservas
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {isStaff && (
            <Button variant="contained" color="primary" onClick={openCreate}>
              Novo incidente
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadIncidents(filterReservation?.id)}
            disabled={loading}
            sx={{ borderColor: "rgba(31, 111, 95, 0.3)", color: "text.primary" }}
          >
            Atualizar
          </Button>
        </Stack>
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 3, maxWidth: 400 }}>
        <Autocomplete
          options={reservations}
          getOptionLabel={(r) =>
            `#${r.id} — ${dayjs(r.start_time).format("DD/MM/YYYY HH:mm")}`
          }
          value={filterReservation}
          onChange={(_, value) => handleFilterChange(value)}
          renderInput={(params) => (
            <TextField {...params} label="Filtrar por reserva" placeholder="Todas as reservas" />
          )}
        />
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{ mb: 2 }}
        >
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : incidents.length === 0 ? (
        <Alert severity="info">Nenhum incidente registrado.</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quando</TableCell>
                  <TableCell>Reserva</TableCell>
                  <TableCell>Severidade</TableCell>
                  <TableCell>Descrição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidents.map((incident, index) => (
                  <TableRow
                    key={incident.id}
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
                      {dayjs(incident.reported_at).format("DD/MM/YYYY HH:mm")}
                    </TableCell>
                    <TableCell>#{incident.reservation_id}</TableCell>
                    <TableCell>
                      <Chip
                        label={SEVERITY_LABEL[incident.severity]}
                        size="small"
                        color={SEVERITY_COLOR[incident.severity]}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {incident.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={closeCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Novo incidente</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Autocomplete
              options={reservations}
              getOptionLabel={(r) =>
                `#${r.id} — ${dayjs(r.start_time).format("DD/MM/YYYY HH:mm")}`
              }
              value={createReservation}
              onChange={(_, value) => setCreateReservation(value)}
              renderInput={(params) => (
                <TextField {...params} label="Reserva *" required />
              )}
            />
            <FormControl fullWidth required>
              <InputLabel id="incident-severity-label">Severidade *</InputLabel>
              <Select
                labelId="incident-severity-label"
                label="Severidade *"
                value={createSeverity}
                onChange={(e) =>
                  setCreateSeverity(e.target.value as IncidentSeverity)
                }
              >
                {SEVERITY_VALUES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {SEVERITY_LABEL[s]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Descrição *"
              multiline
              rows={4}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              fullWidth
              required
              error={createDescription.trim().length === 0 && createDescription.length > 0}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCreate} disabled={submitting} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreate}
            disabled={submitting || !createFormValid}
          >
            {submitting ? "Aguarde..." : "Registrar incidente"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
