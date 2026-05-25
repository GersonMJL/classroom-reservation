import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import {
  clearAuthTokens,
  getTokenRoles,
  hasValidAccessToken,
  userApi,
} from "../services/api";
import type { User } from "../services/api";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useToast } from "../ui/useToast";
import { PageHeader, PageSection, DataTable, StatusChip } from "../ui";
import type { Column } from "../ui/DataTable";

const AVAILABLE_ROLES = ["admin", "manager", "technician", "requester"];

const roleLabelMap: Record<string, string> = {
  admin:      "Administrador",
  manager:    "Gestor",
  technician: "Técnico",
  requester:  "Solicitante",
};

const getRoleLabel = (role: string) => roleLabelMap[role] ?? role;

export default function UsersManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDraft, setRoleDraft] = useState<string[]>([]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: ["requester"] as string[],
  });

  const hasAdminRole = useMemo(() => {
    const roles = getTokenRoles();
    return roles.includes("admin");
  }, []);

  const loadUsers = async () => {
    setLoading(true);
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
        clearAuthTokens();
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

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasValidAccessToken()) {
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
    if (!normalizedSearch) return users;

    return users.filter((user) => {
      const name = user.name.toLowerCase();
      const email = user.email.toLowerCase();
      return (
        name.includes(normalizedSearch)
        || email.includes(normalizedSearch)
        || user.roles.some(
            (role) =>
              role.toLowerCase().includes(normalizedSearch)
              || getRoleLabel(role).toLowerCase().includes(normalizedSearch)
          )
      );
    });
  }, [users, searchValue]);

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setRoleDraft(user.roles.length > 0 ? user.roles : ["requester"]);
    setIsRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    setIsRoleDialogOpen(false);
    setSelectedUser(null);
    setRoleDraft([]);
  };

  const openCreateDialog = () => {
    setCreateForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      roles: ["requester"],
    });
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleCreateUser = async () => {
    const email = createForm.email.trim();
    const name = createForm.name.trim();

    if (!name) { toast.error("Nome é obrigatório"); return; }
    if (!email) { toast.error("E-mail é obrigatório"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Informe um endereço de e-mail válido"); return; }
    if (!createForm.password) { toast.error("Senha é obrigatória"); return; }
    if (createForm.password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (createForm.password !== createForm.confirmPassword) { toast.error("As senhas não coincidem"); return; }

    const normalizedRoles = Array.from(new Set(createForm.roles));
    if (normalizedRoles.length === 0) { toast.error("Pelo menos um perfil é obrigatório"); return; }

    setLoading(true);
    try {
      const created = await userApi.createUser({
        name,
        email,
        password: createForm.password,
        active: true,
        roles: normalizedRoles,
      });
      setUsers((prev) => [...prev, created].sort((a, b) => a.id - b.id));
      toast.success(`Usuário ${created.email} criado`);
      closeCreateDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;

    if (selectedUser.id === currentUserId && !roleDraft.includes("admin")) {
      toast.error("Você não pode remover o próprio perfil de administrador.");
      return;
    }

    setLoading(true);
    try {
      const updated = await userApi.updateUserRoles(selectedUser.id, {
        roles: Array.from(new Set(roleDraft)),
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(`Perfis atualizados para ${updated.email}`);
      closeRoleDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar perfis do usuário");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (user: User) => {
    if (user.id === currentUserId) {
      toast.error("Você não pode excluir sua própria conta de administrador.");
      return;
    }
    setDeleteTarget(user);
  };

  const closeDeleteConfirm = () => setDeleteTarget(null);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      await userApi.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success(`Usuário ${deleteTarget.email} excluído`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir usuário");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<Column<User>[]>(() => [
    {
      key: "id",
      header: "ID",
      width: 60,
      cell: (u) => u.id,
    },
    {
      key: "name",
      header: "Nome",
      cell: (u) => u.name,
    },
    {
      key: "email",
      header: "E-mail",
      cell: (u) => u.email,
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => (
        <StatusChip
          tone={u.active ? "success" : "neutral"}
          label={u.active ? "Ativo" : "Inativo"}
        />
      ),
    },
    {
      key: "roles",
      header: "Perfis",
      cell: (u) => (
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
          {u.roles.map((role) => (
            <StatusChip
              key={role}
              tone={role === "admin" ? "warning" : "neutral"}
              label={getRoleLabel(role)}
            />
          ))}
        </Stack>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      align: "center",
      cell: (u) => (
        <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => openRoleDialog(u)}
            disabled={loading}
          >
            Perfis
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => openDeleteConfirm(u)}
            disabled={loading}
          >
            Excluir
          </Button>
        </Stack>
      ),
    },
  ], [loading, openRoleDialog, openDeleteConfirm]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Administração de Usuários"
        description="Gerencie perfis de usuários e remova contas."
        actions={
          <>
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
          </>
        }
      />

      <PageSection padded>
        <TextField
          fullWidth
          size="small"
          label="Pesquisar usuários"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Pesquise por nome, e-mail ou perfil"
        />
      </PageSection>

      <PageSection padded={false}>
        <DataTable
          columns={columns}
          rows={filteredUsers}
          loading={loading}
          getRowKey={(u) => u.id}
          emptyTitle="Nenhum usuário encontrado"
          emptyDescription="Tente ajustar o filtro de pesquisa."
        />
      </PageSection>

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
                setRoleDraft(nextRoles.length > 0 ? nextRoles : ["requester"]);
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
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, name: event.target.value }))
            }
            fullWidth
            required
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
                  roles: nextRoles.length > 0 ? nextRoles : ["requester"],
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir usuário"
        description={`Excluir o usuário ${deleteTarget?.email}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDeleteUser}
        onCancel={closeDeleteConfirm}
      />
    </Container>
  );
}
