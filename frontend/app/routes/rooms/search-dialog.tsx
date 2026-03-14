import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { RoomSearchType } from "./types";

type SearchDialogProps = {
  open: boolean;
  searchType: RoomSearchType;
  searchValue: string;
  onClose: () => void;
  onSearchTypeChange: (value: RoomSearchType) => void;
  onSearchValueChange: (value: string) => void;
  onSearch: () => void;
};

export function SearchDialog({
  open,
  searchType,
  searchValue,
  onClose,
  onSearchTypeChange,
  onSearchValueChange,
  onSearch,
}: SearchDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pesquisar Ambientes</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Tipo de Pesquisa</InputLabel>
          <Select
            value={searchType}
            onChange={(e) => onSearchTypeChange(e.target.value as RoomSearchType)}
            label="Tipo de Pesquisa"
          >
            <MenuItem value="capacity">por capacidade</MenuItem>
            <MenuItem value="location">por localização</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={searchType === "capacity" ? "Capacidade Mínima" : "Localização"}
          value={searchValue}
          onChange={(e) => onSearchValueChange(e.target.value)}
          fullWidth
          type={searchType === "capacity" ? "number" : "text"}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onSearch} variant="contained">
          Pesquisar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
