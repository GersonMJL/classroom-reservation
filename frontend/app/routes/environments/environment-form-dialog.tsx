import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  FormControlLabel,
  Switch,
} from "@mui/material";
import type { Dispatch, SetStateAction } from "react";
import type { EnvironmentCreate, Location } from "../../services/api";

type EnvironmentFormDialogProps = {
  open: boolean;
  isEditMode: boolean;
  formData: EnvironmentCreate;
  locations: Location[];
  loadingLocations: boolean;
  setFormData: Dispatch<SetStateAction<EnvironmentCreate>>;
  onClose: () => void;
  onSave: () => void;
};

export function EnvironmentFormDialog({
  open,
  isEditMode,
  formData,
  locations,
  loadingLocations,
  setFormData,
  onClose,
  onSave,
}: EnvironmentFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? "Editar Ambiente" : "Novo Ambiente"}</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Nome do ambiente"
          value={formData.name}
          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
          fullWidth
          placeholder="Ex.: Laboratorio de Robotica"
        />

        <FormControl fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={formData.type}
            label="Tipo"
            onChange={(event) =>
              setFormData({ ...formData, type: event.target.value as EnvironmentCreate["type"] })
            }
          >
            <MenuItem value="CLASSROOM">Sala de aula</MenuItem>
            <MenuItem value="LABORATORY">Laboratorio</MenuItem>
            <MenuItem value="AUDITORIUM">Auditorio</MenuItem>
            <MenuItem value="MEETING_ROOM">Sala de reuniao</MenuItem>
            <MenuItem value="STUDIO">Estudio</MenuItem>
            <MenuItem value="MULTIPURPOSE">Multiproposito</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Localização</InputLabel>
          <Select
            value={formData.location_id > 0 ? formData.location_id : ""}
            label="Localização"
            disabled={loadingLocations || locations.length === 0}
            onChange={(event) => {
              const value = Number(event.target.value) || 0;
              setFormData({ ...formData, location_id: value });
            }}
          >
            {locations.length === 0 && (
              <MenuItem disabled value="">
                Nenhuma localização cadastrada
              </MenuItem>
            )}
            {locations.map((location) => (
              <MenuItem key={location.id} value={location.id}>
                {`${location.campus} - ${location.building} - ${location.floor}`}
              </MenuItem>
            ))}
          </Select>
          {loadingLocations && <FormHelperText>Carregando localizações...</FormHelperText>}
        </FormControl>

        <TextField
          label="Capacidade"
          type="number"
          value={formData.capacity}
          onChange={(event) =>
            setFormData({
              ...formData,
              capacity: parseInt(event.target.value, 10) || 0,
            })
          }
          fullWidth
          slotProps={{ htmlInput: { min: 1 } }}
        />

        <FormControl fullWidth>
          <InputLabel>Criticidade</InputLabel>
          <Select
            value={formData.criticality}
            label="Criticidade"
            onChange={(event) =>
              setFormData({
                ...formData,
                criticality: event.target.value as EnvironmentCreate["criticality"],
              })
            }
          >
            <MenuItem value="COMMON">Comum</MenuItem>
            <MenuItem value="CONTROLLED">Controlado</MenuItem>
            <MenuItem value="RESTRICTED">Restrito</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Horario de funcionamento"
          value={formData.operating_hours}
          onChange={(event) =>
            setFormData({ ...formData, operating_hours: event.target.value })
          }
          fullWidth
          placeholder="Ex.: 08:00-18:00"
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.requires_approval}
              onChange={(event) =>
                setFormData({ ...formData, requires_approval: event.target.checked })
              }
            />
          }
          label="Exige aprovacao"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSave}>
          {isEditMode ? "Salvar" : "Criar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
