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
import type { Room } from "../../services/api";

type RoomsTableProps = {
  rooms: Room[];
  loading: boolean;
  isAdmin: boolean;
  currentPage: number;
  itemsPerPage: number;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (roomId: number) => void;
  onPageChange: (page: number) => void;
};

export function RoomsTable({
  rooms,
  loading,
  isAdmin,
  currentPage,
  itemsPerPage,
  onEditRoom,
  onDeleteRoom,
  onPageChange,
}: RoomsTableProps) {
  if (loading) {
    return <CircularProgress />;
  }

  if (rooms.length === 0) {
    return <Alert severity="info">Nenhum ambiente encontrado</Alert>;
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>ID do Ambiente</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell align="right">Capacidade</TableCell>
              <TableCell>Acessibilidade</TableCell>
              <TableCell>Criticidade</TableCell>
              <TableCell>Finalidades</TableCell>
              <TableCell>Recursos</TableCell>
              {isAdmin && <TableCell align="center">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell sx={{ fontWeight: 500 }}>{room.room_id}</TableCell>
                <TableCell>{room.room_type}</TableCell>
                <TableCell>{room.location}</TableCell>
                <TableCell align="right">{room.capacity}</TableCell>
                <TableCell>
                  {room.accessibility ? (
                    <Chip label="Sim" color="success" size="small" />
                  ) : (
                    <Chip label="Não" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={room.criticality} size="small" color="primary" />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {room.allowed_purposes.map((purpose) => (
                      <Chip key={purpose} label={purpose} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      label={`Fixos: ${room.fixed_resources.length}`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`Opcionais: ${room.optional_resources.length}`}
                      variant="outlined"
                    />
                  </Stack>
                </TableCell>
                {isAdmin && (
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => onEditRoom(room)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => onDeleteRoom(room.id)}
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
          count={Math.ceil(rooms.length / itemsPerPage)}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
        />
      </Box>
    </>
  );
}
