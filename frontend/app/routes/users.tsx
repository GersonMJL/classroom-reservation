import { useEffect, useMemo, useState } from "react";
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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import { getTokenRoles, userApi } from "../services/api";
import type { User } from "../services/api";

const AVAILABLE_ROLES = ["user", "admin"];

const roleLabelMap: Record<string, string> = {
  user: "Usuário",
  admin: "Administrador",
};

const getRoleLabel = (role: string) => roleLabelMap[role] || role;

export default function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDraft, setRoleDraft] = useState<string[]>([]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: ["user"] as string[],
  });

  const hasAdminRole = useMemo(() => {
    const roles = getTokenRoles();
    return roles.includes("admin");
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const [allUsers, me] = await Promise.all([
        userApi.getAllUsers(0, 200),
        userApi.getCurrentUser(),
      ]);
      setUsers(allUsers);
      setCurrentUserId(me.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar usuários";

      if (
        message.includes("Could not validate credentials")
        || message.includes("Token expired")
        || message.includes("Não foi possível validar as credenciais")
        || message.includes("Token expirado")
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
        return;
      }

      if (
        message.includes("Insufficient permissions")
        || message.includes("Permissões insuficientes")
      ) {
        navigate("/");
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!hasAdminRole) {
      navigate("/");
      return;
    }

    loadUsers();
  }, [navigate, hasAdminRole]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const fullName = user.full_name?.toLowerCase() || "";
      const email = user.email.toLowerCase();
      const roleText = user.roles.join(" ").toLowerCase();
      return (
        fullName.includes(normalizedSearch)
        || email.includes(normalizedSearch)
        || roleText.includes(normalizedSearch)
      );
    });
  }, [users, searchValue]);

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setRoleDraft(user.roles.length > 0 ? user.roles : ["user"]);
    setIsRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    setIsRoleDialogOpen(false);
    setSelectedUser(null);
    setRoleDraft([]);
  };

  const openCreateDialog = () => {
    setCreateForm({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      roles: ["user"],
    });
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleCreateUser = async () => {
    const email = createForm.email.trim();
    const fullName = createForm.fullName.trim();

    if (!email) {
      setError("E-mail é obrigatório");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um endereço de e-mail válido");
      return;
    }

    if (!createForm.password) {
      setError("Senha é obrigatória");
      return;
    }

    if (createForm.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const normalizedRoles = Array.from(new Set(createForm.roles));
    if (normalizedRoles.length === 0) {
      setError("Pelo menos um perfil é obrigatório");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const created = await userApi.createUser({
        email,
        password: createForm.password,
        full_name: fullName || undefined,
        is_active: true,
      });

      let finalUser = created;
      if (
        normalizedRoles.length !== 1
        || normalizedRoles[0] !== "user"
      ) {
        finalUser = await userApi.updateUserRoles(created.id, {
          roles: normalizedRoles,
        });
      }

      setUsers((prev) => [...prev, finalUser].sort((a, b) => a.id - b.id));
      setSuccessMessage(`Usuário ${finalUser.email} criado`);
      closeCreateDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) {
      return;
    }

    if (selectedUser.id === currentUserId && !roleDraft.includes("admin")) {
      setError("Você não pode remover o próprio perfil de administrador.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const updated = await userApi.updateUserRoles(selectedUser.id, {
        roles: Array.from(new Set(roleDraft)),
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setSuccessMessage(`Perfis atualizados para ${updated.email}`);
      closeRoleDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar perfis do usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUserId) {
      setError("Você não pode excluir sua própria conta de administrador.");
      return;
    }

    const confirmed = window.confirm(
      `Excluir o usuário ${user.email}? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await userApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setSuccessMessage(`Usuário ${user.email} excluído`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Administração de Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie perfis de usuários e remova contas.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            disabled={loading}
          >
            Criar Usuário
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage("")} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Pesquisar usuários"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Pesquise por nome, e-mail ou perfil"
        />
      </Paper>

      {loading && users.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>ID</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Perfis</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.is_active ? "Ativo" : "Inativo"}
                      color={user.is_active ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75}>
                      {user.roles.map((role) => (
                        <Chip
                          key={`${user.id}-${role}`}
                          size="small"
                          label={getRoleLabel(role)}
                          color={role === "admin" ? "primary" : "default"}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openRoleDialog(user)}
                        disabled={loading}
                      >
                        Perfis
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteUser(user)}
                        disabled={loading || user.id === currentUserId}
                      >
                        Excluir
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Alert severity="info">Nenhum usuário encontrado para este filtro.</Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isRoleDialogOpen} onClose={closeRoleDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Atualizar Perfis</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {selectedUser ? `Usuário: ${selectedUser.email}` : "Selecione os perfis"}
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="roles-label">Perfis</InputLabel>
            <Select
              labelId="roles-label"
              multiple
              value={roleDraft}
              label="Perfis"
              onChange={(event) => {
                const nextValue = event.target.value;
                const nextRoles =
                  typeof nextValue === "string" ? nextValue.split(",") : nextValue;
                setRoleDraft(nextRoles.length > 0 ? nextRoles : ["user"]);
              }}
              renderValue={(selected) => (selected as string[]).map(getRoleLabel).join(", ")}
            >
              {AVAILABLE_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {getRoleLabel(role)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoleDialog}>Cancelar</Button>
          <Button onClick={handleSaveRoles} variant="contained" disabled={loading}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onClose={closeCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Usuário</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nome Completo"
            value={createForm.fullName}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))
            }
            fullWidth
            placeholder="Opcional"
          />
          <TextField
            label="E-mail"
            type="email"
            value={createForm.email}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, email: event.target.value }))
            }
            fullWidth
            required
          />
          <TextField
            label="Senha"
            type="password"
            value={createForm.password}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, password: event.target.value }))
            }
            fullWidth
            required
          />
          <TextField
            label="Confirmar Senha"
            type="password"
            value={createForm.confirmPassword}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
            }
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel id="create-roles-label">Perfis</InputLabel>
            <Select
              labelId="create-roles-label"
              multiple
              value={createForm.roles}
              label="Perfis"
              onChange={(event) => {
                const nextValue = event.target.value;
                const nextRoles =
                  typeof nextValue === "string" ? nextValue.split(",") : nextValue;
                setCreateForm((prev) => ({
                  ...prev,
                  roles: nextRoles.length > 0 ? nextRoles : ["user"],
                }));
              }}
              renderValue={(selected) => (selected as string[]).map(getRoleLabel).join(", ")}
            >
              {AVAILABLE_ROLES.map((role) => (
                <MenuItem key={`create-${role}`} value={role}>
                  {getRoleLabel(role)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateDialog}>Cancelar</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={loading}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
