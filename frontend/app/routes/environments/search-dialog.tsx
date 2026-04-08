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
import type { EnvironmentSearchType } from "./types";

type SearchDialogProps = {
  open: boolean;
  searchType: EnvironmentSearchType;
  searchValue: string;
  onClose: () => void;
  onSearchTypeChange: (value: EnvironmentSearchType) => void;
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
            onChange={(e) => onSearchTypeChange(e.target.value as EnvironmentSearchType)}
            label="Tipo de Pesquisa"
          >
            <MenuItem value="name">por nome</MenuItem>
            <MenuItem value="capacity">por capacidade minima</MenuItem>
            <MenuItem value="location_id">por ID da localizacao</MenuItem>
            <MenuItem value="criticality">por criticidade</MenuItem>
            <MenuItem value="type">por tipo</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={
            searchType === "capacity"
              ? "Capacidade minima"
              : searchType === "location_id"
                ? "ID da localizacao"
                : searchType === "criticality"
                  ? "Criticidade (COMMON, CONTROLLED, RESTRICTED)"
                  : searchType === "type"
                    ? "Tipo (CLASSROOM, LABORATORY, ...)"
                    : "Nome"
          }
          value={searchValue}
          onChange={(e) => onSearchValueChange(e.target.value)}
          fullWidth
          type={searchType === "capacity" || searchType === "location_id" ? "number" : "text"}
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
