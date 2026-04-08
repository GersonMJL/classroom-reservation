import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Environment } from "../../services/api";

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
  if (loading) {
    return <CircularProgress />;
  }

  if (environments.length === 0) {
    return <Alert severity="info">Nenhum ambiente encontrado</Alert>;
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">ID Localizacao</TableCell>
              <TableCell align="right">Capacidade</TableCell>
              <TableCell>Criticidade</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell>Aprovacao</TableCell>
              {isAdmin && <TableCell align="center">Acoes</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {environments.map((environment) => (
              <TableRow key={environment.id}>
                <TableCell sx={{ fontWeight: 500 }}>{environment.name}</TableCell>
                <TableCell>{environment.type}</TableCell>
                <TableCell align="right">{environment.location_id}</TableCell>
                <TableCell align="right">{environment.capacity}</TableCell>
                <TableCell>
                  <Chip label={environment.criticality} size="small" color="primary" />
                </TableCell>
                <TableCell>{environment.operating_hours}</TableCell>
                <TableCell>
                  {environment.requires_approval ? (
                    <Chip label="Obrigatoria" color="warning" size="small" />
                  ) : (
                    <Chip label="Nao obrigatoria" size="small" />
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => onEditEnvironment(environment)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => onDeleteEnvironment(environment.id)}
                      >
                        Excluir
                      </Button>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={Math.ceil(environments.length / itemsPerPage)}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
        />
      </Box>
    </>
  );
}
