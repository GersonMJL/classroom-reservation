import {
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
import { FormDialog } from "../../ui/FormDialog";
import { FormField } from "../../ui/FormField";

type EnvironmentFormDialogProps = {
  open: boolean;
  isEditMode: boolean;
  formData: EnvironmentCreate;
  locations: Location[];
  loadingLocations: boolean;
  setFormData: Dispatch<SetStateAction<EnvironmentCreate>>;
  onClose: () => void;
  onSave: () => void;
  submitting?: boolean;
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
  submitting,
}: EnvironmentFormDialogProps) {
  return (
    <FormDialog
      open={open}
      title={isEditMode ? "Editar ambiente" : "Novo ambiente"}
      onClose={onClose}
      onSubmit={onSave}
      submitLabel={isEditMode ? "Salvar" : "Criar"}
      submitting={submitting}
      maxWidth="sm"
    >
      <FormField
        label="Código"
        value={formData.code}
        onChange={(event) => setFormData({ ...formData, code: event.target.value })}
        placeholder="Ex.: LAB-ROB-01"
      />

      <FormField
        label="Nome do ambiente"
        value={formData.name}
        onChange={(event) => setFormData({ ...formData, name: event.target.value })}
        placeholder="Ex.: Laboratório de Robótica"
      />

      <FormControl fullWidth margin="dense">
        <InputLabel shrink>Tipo</InputLabel>
        <Select
          value={formData.type}
          label="Tipo"
          onChange={(event) =>
            setFormData({ ...formData, type: event.target.value as EnvironmentCreate["type"] })
          }
        >
          <MenuItem value="CLASSROOM">Sala de aula</MenuItem>
          <MenuItem value="LABORATORY">Laboratório</MenuItem>
          <MenuItem value="AUDITORIUM">Auditório</MenuItem>
          <MenuItem value="MEETING_ROOM">Sala de reunião</MenuItem>
          <MenuItem value="STUDIO">Estúdio</MenuItem>
          <MenuItem value="MULTIPURPOSE">Multipropósito</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="dense">
        <InputLabel shrink>Localização</InputLabel>
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

      <FormField
        label="Capacidade"
        type="number"
        value={formData.capacity}
        onChange={(event) =>
          setFormData({
            ...formData,
            capacity: parseInt(event.target.value, 10) || 0,
          })
        }
        slotProps={{ htmlInput: { min: 1 } }}
      />

      <FormControl fullWidth margin="dense">
        <InputLabel shrink>Criticidade</InputLabel>
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

      <FormField
        label="Horário de funcionamento"
        value={formData.operating_hours}
        onChange={(event) =>
          setFormData({ ...formData, operating_hours: event.target.value })
        }
        placeholder="Ex.: 08:00-18:00"
      />

      <FormField
        label="Buffer antes (min)"
        type="number"
        value={formData.buffer_before_min ?? 0}
        onChange={(event) =>
          setFormData({
            ...formData,
            buffer_before_min: parseInt(event.target.value, 10) || 0,
          })
        }
        slotProps={{ htmlInput: { min: 0 } }}
      />
      <FormField
        label="Buffer depois (min)"
        type="number"
        value={formData.buffer_after_min ?? 0}
        onChange={(event) =>
          setFormData({
            ...formData,
            buffer_after_min: parseInt(event.target.value, 10) || 0,
          })
        }
        slotProps={{ htmlInput: { min: 0 } }}
      />
      <FormField
        label="Tolerância de no-show (min)"
        type="number"
        value={formData.noshow_tolerance_min ?? 15}
        onChange={(event) =>
          setFormData({
            ...formData,
            noshow_tolerance_min: parseInt(event.target.value, 10) || 0,
          })
        }
        slotProps={{ htmlInput: { min: 0 } }}
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
        label="Exige aprovação"
        sx={{ mt: 1 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={formData.active ?? true}
            onChange={(event) =>
              setFormData({ ...formData, active: event.target.checked })
            }
          />
        }
        label="Ativo (desmarcar bloqueia novas reservas)"
        sx={{ mt: 1 }}
      />
    </FormDialog>
  );
}
