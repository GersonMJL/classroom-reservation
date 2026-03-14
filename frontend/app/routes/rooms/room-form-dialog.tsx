import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Dispatch, SetStateAction } from "react";
import type {
  Purpose,
  Resource,
  RoomCreate,
} from "../../services/api";
import type { TypeAttributeField } from "./types";

type RoomFormDialogProps = {
  open: boolean;
  isEditMode: boolean;
  formData: RoomCreate;
  purposes: Purpose[];
  resources: Resource[];
  purposeInput: string;
  selectedPurpose: string;
  fixedResourceId: number | "";
  optionalResourceId: number | "";
  fixedResourceQty: number;
  optionalResourceQty: number;
  typeAttributeFields: TypeAttributeField[];
  setFormData: Dispatch<SetStateAction<RoomCreate>>;
  setPurposeInput: (value: string) => void;
  setSelectedPurpose: (value: string) => void;
  setFixedResourceId: (value: number | "") => void;
  setOptionalResourceId: (value: number | "") => void;
  setFixedResourceQty: (value: number) => void;
  setOptionalResourceQty: (value: number) => void;
  onClose: () => void;
  onSave: () => void;
  onAddPurpose: () => void;
  onCreatePurpose: () => void;
  onRemovePurpose: (purpose: string) => void;
  onAddFixedResource: () => void;
  onAddOptionalResource: () => void;
  onRemoveResourceAssignment: (
    key: "fixed_resources" | "optional_resources",
    resourceId: number
  ) => void;
  onAddTypeAttributeField: () => void;
  onUpdateTypeAttributeField: (
    index: number,
    field: keyof TypeAttributeField,
    value: string
  ) => void;
  onRemoveTypeAttributeField: (index: number) => void;
  getResourceLabel: (resourceId: number) => string;
};

export function RoomFormDialog({
  open,
  isEditMode,
  formData,
  purposes,
  resources,
  purposeInput,
  selectedPurpose,
  fixedResourceId,
  optionalResourceId,
  fixedResourceQty,
  optionalResourceQty,
  typeAttributeFields,
  setFormData,
  setPurposeInput,
  setSelectedPurpose,
  setFixedResourceId,
  setOptionalResourceId,
  setFixedResourceQty,
  setOptionalResourceQty,
  onClose,
  onSave,
  onAddPurpose,
  onCreatePurpose,
  onRemovePurpose,
  onAddFixedResource,
  onAddOptionalResource,
  onRemoveResourceAssignment,
  onAddTypeAttributeField,
  onUpdateTypeAttributeField,
  onRemoveTypeAttributeField,
  getResourceLabel,
}: RoomFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? "Editar Ambiente" : "Criar Novo Ambiente"}</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="ID do Ambiente"
          value={formData.room_id}
          onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
          fullWidth
          placeholder="ex.: SALA001"
          disabled={isEditMode}
        />
        <FormControl fullWidth>
          <InputLabel>Tipo de Ambiente</InputLabel>
          <Select
            value={formData.room_type}
            onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
            label="Tipo de Ambiente"
          >
            <MenuItem value="classroom">Sala de Aula</MenuItem>
            <MenuItem value="meeting_room">Sala de Reunião</MenuItem>
            <MenuItem value="auditorium">Auditório</MenuItem>
            <MenuItem value="laboratory" disabled>
              Laboratório (temporariamente indisponível)
            </MenuItem>
          </Select>
          <FormHelperText>
            Laboratório está desabilitado até a implementação da seleção de supervisor.
          </FormHelperText>
        </FormControl>
        <TextField
          label="Localização"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          fullWidth
          placeholder="ex.: Bloco A, 3º andar"
        />
        <TextField
          label="Capacidade"
          type="number"
          value={formData.capacity}
          onChange={(e) =>
            setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })
          }
          fullWidth
          inputProps={{ min: 1 }}
        />
        <FormControl fullWidth>
          <InputLabel>Acessibilidade</InputLabel>
          <Select
            value={formData.accessibility.toString()}
            onChange={(e) =>
              setFormData({ ...formData, accessibility: e.target.value === "true" })
            }
            label="Acessibilidade"
          >
            <MenuItem value="true">Sim</MenuItem>
            <MenuItem value="false">Não</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Criticidade</InputLabel>
          <Select
            value={formData.criticality}
            onChange={(e) =>
              setFormData({
                ...formData,
                criticality: e.target.value as RoomCreate["criticality"],
              })
            }
            label="Criticidade"
          >
            <MenuItem value="common">Comum</MenuItem>
            <MenuItem value="controlled">Controlada</MenuItem>
            <MenuItem value="restricted">Restrita</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Finalidades Permitidas
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Selecionar finalidade</InputLabel>
              <Select
                value={selectedPurpose}
                label="Selecionar finalidade"
                onChange={(e) => setSelectedPurpose(e.target.value)}
              >
                {purposes.map((purpose) => (
                  <MenuItem key={purpose.id} value={purpose.name}>
                    {purpose.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={onAddPurpose}>
              Adicionar
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              label="Criar nova finalidade"
              value={purposeInput}
              onChange={(e) => setPurposeInput(e.target.value)}
              size="small"
              fullWidth
              placeholder="ex.: Ensino"
            />
            <Button variant="outlined" onClick={onCreatePurpose}>
              Criar
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {formData.allowed_purposes.map((purpose) => (
              <Chip
                key={purpose}
                label={purpose}
                onDelete={() => onRemovePurpose(purpose)}
              />
            ))}
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recursos Fixos
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Recurso</InputLabel>
              <Select
                value={fixedResourceId}
                label="Recurso"
                onChange={(e) => setFixedResourceId(Number(e.target.value))}
              >
                {resources.map((resource) => (
                  <MenuItem key={resource.id} value={resource.id}>
                    {resource.resource_code} - {resource.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Qtd"
              type="number"
              value={fixedResourceQty}
              onChange={(e) => setFixedResourceQty(parseInt(e.target.value, 10) || 1)}
              inputProps={{ min: 1 }}
              sx={{ width: 110 }}
            />
            <Button variant="outlined" onClick={onAddFixedResource}>
              Adicionar
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {formData.fixed_resources.map((item) => (
              <Chip
                key={`fixed-${item.resource_id}`}
                label={`${getResourceLabel(item.resource_id)} x${item.quantity}`}
                onDelete={() =>
                  onRemoveResourceAssignment("fixed_resources", item.resource_id)
                }
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recursos Opcionais
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Recurso</InputLabel>
              <Select
                value={optionalResourceId}
                label="Recurso"
                onChange={(e) => setOptionalResourceId(Number(e.target.value))}
              >
                {resources.map((resource) => (
                  <MenuItem key={resource.id} value={resource.id}>
                    {resource.resource_code} - {resource.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Qtd"
              type="number"
              value={optionalResourceQty}
              onChange={(e) => setOptionalResourceQty(parseInt(e.target.value, 10) || 1)}
              inputProps={{ min: 1 }}
              sx={{ width: 110 }}
            />
            <Button variant="outlined" onClick={onAddOptionalResource}>
              Adicionar
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {formData.optional_resources.map((item) => (
              <Chip
                key={`optional-${item.resource_id}`}
                label={`${getResourceLabel(item.resource_id)} x${item.quantity}`}
                onDelete={() =>
                  onRemoveResourceAssignment("optional_resources", item.resource_id)
                }
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle2">Atributos Específicos do Tipo</Typography>
            <Button variant="outlined" size="small" onClick={onAddTypeAttributeField}>
              Adicionar atributo
            </Button>
          </Stack>
          {typeAttributeFields.length === 0 ? (
            <FormHelperText sx={{ m: 0 }}>
              Nenhum atributo adicional informado. Use "Adicionar atributo" para incluir.
            </FormHelperText>
          ) : (
            <Stack spacing={1}>
              {typeAttributeFields.map((item, index) => (
                <Stack key={`type-attribute-${index}`} direction="row" spacing={1}>
                  <TextField
                    size="small"
                    label="Chave"
                    value={item.key}
                    onChange={(e) =>
                      onUpdateTypeAttributeField(index, "key", e.target.value)
                    }
                    placeholder="ex.: regulations"
                    sx={{ flex: 1 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={item.valueType}
                      label="Tipo"
                      onChange={(e) =>
                        onUpdateTypeAttributeField(
                          index,
                          "valueType",
                          e.target.value as TypeAttributeField["valueType"]
                        )
                      }
                    >
                      <MenuItem value="text">Texto</MenuItem>
                      <MenuItem value="number">Numero</MenuItem>
                      <MenuItem value="boolean">Booleano</MenuItem>
                    </Select>
                  </FormControl>
                  {item.valueType === "boolean" ? (
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Valor</InputLabel>
                      <Select
                        value={item.value || "false"}
                        label="Valor"
                        onChange={(e) =>
                          onUpdateTypeAttributeField(index, "value", e.target.value)
                        }
                      >
                        <MenuItem value="true">Sim</MenuItem>
                        <MenuItem value="false">Não</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      size="small"
                      label="Valor"
                      value={item.value}
                      onChange={(e) =>
                        onUpdateTypeAttributeField(index, "value", e.target.value)
                      }
                      placeholder={
                        item.valueType === "number"
                          ? "ex.: 10"
                          : "ex.: Uso obrigatorio de EPI"
                      }
                      type={item.valueType === "number" ? "number" : "text"}
                      sx={{ flex: 2 }}
                    />
                  )}
                  <Button
                    color="error"
                    onClick={() => onRemoveTypeAttributeField(index)}
                    startIcon={<DeleteIcon />}
                  >
                    Remover
                  </Button>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onSave} variant="contained">
          {isEditMode ? "Salvar" : "Criar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
