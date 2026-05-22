import { Box, Button, Chip, Pagination, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Environment } from "../../services/api";
import { DataTable, type Column } from "~/ui";

type EnvironmentsTableProps = {
  environments: Environment[];
  loading: boolean;
  isAdmin: boolean;
  currentPage: number;
  itemsPerPage: number;
  onEditEnvironment: (environment: Environment) => void;
  onDeleteEnvironment: (environmentId: number) => void;
  onPageChange: (page: number) => void;
};

export function EnvironmentsTable({
  environments,
  loading,
  isAdmin,
  currentPage,
  itemsPerPage,
  onEditEnvironment,
  onDeleteEnvironment,
  onPageChange,
}: EnvironmentsTableProps) {
  const columns: Column<Environment>[] = [
    { key: "name", header: "Nome", cell: (e) => <span style={{ fontWeight: 500 }}>{e.name}</span> },
    { key: "type", header: "Tipo", cell: (e) => e.type },
    { key: "location_id", header: "ID Localização", cell: (e) => e.location_id, align: "right" },
    { key: "capacity", header: "Capacidade", cell: (e) => e.capacity, align: "right" },
    {
      key: "criticality",
      header: "Criticidade",
      cell: (e) => <Chip label={e.criticality} size="small" color="primary" />,
    },
    { key: "operating_hours", header: "Horário", cell: (e) => e.operating_hours },
    {
      key: "requires_approval",
      header: "Aprovação",
      cell: (e) =>
        e.requires_approval ? (
          <Chip label="Obrigatória" color="warning" size="small" />
        ) : (
          <Chip label="Não obrigatória" size="small" />
        ),
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            header: "",
            width: 160,
            align: "center" as const,
            cell: (e: Environment) => (
              <Stack direction="row" spacing={1} justifyContent="center">
                <Button size="small" startIcon={<EditIcon />} onClick={() => onEditEnvironment(e)}>
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => onDeleteEnvironment(e.id)}
                >
                  Excluir
                </Button>
              </Stack>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={environments}
        loading={loading}
        getRowKey={(e) => e.id}
        emptyTitle="Nenhum ambiente cadastrado"
        emptyDescription="Crie o primeiro ambiente para começar a permitir reservas."
      />

      {!loading && environments.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={Math.ceil(environments.length / itemsPerPage)}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
          />
        </Box>
      )}
    </>
  );
}
