import { useState } from "react";
import { environmentApi } from "../../services/api";
import type { Environment, EnvironmentCreate } from "../../services/api";

const initialFormData: EnvironmentCreate = {
  name: "",
  type: "CLASSROOM",
  criticality: "COMMON",
  capacity: 1,
  location_id: 1,
  operating_hours: "08:00-18:00",
  requires_approval: false,
};

type UseEnvironmentFormArgs = {
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  loadEnvironments: (page?: number) => Promise<void>;
};

export function useEnvironmentForm({ setLoading, setError, loadEnvironments }: UseEnvironmentFormArgs) {
  const [openEnvironmentDialog, setOpenEnvironmentDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEnvironmentId, setEditingEnvironmentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EnvironmentCreate>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditMode(false);
    setEditingEnvironmentId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setOpenEnvironmentDialog(true);
  };

  const openEditDialog = (environment: Environment) => {
    setIsEditMode(true);
    setEditingEnvironmentId(environment.id);
    setFormData({
      name: environment.name,
      type: environment.type,
      criticality: environment.criticality,
      capacity: environment.capacity,
      location_id: environment.location_id,
      operating_hours: environment.operating_hours,
      requires_approval: environment.requires_approval,
    });
    setOpenEnvironmentDialog(true);
  };

  const closeEnvironmentDialog = () => {
    setOpenEnvironmentDialog(false);
    resetForm();
  };

  const handleSaveEnvironment = async () => {
    if (!formData.name.trim()) {
      setError("Nome do ambiente e obrigatorio");
      return;
    }
    if (!formData.type.trim()) {
      setError("Tipo de ambiente é obrigatório");
      return;
    }
    if (formData.location_id <= 0) {
      setError("Informe um local valido");
      return;
    }
    if (formData.capacity <= 0) {
      setError("Capacidade deve ser maior que 0");
      return;
    }
    if (!formData.operating_hours.trim()) {
      setError("Horario de funcionamento e obrigatorio");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && editingEnvironmentId !== null) {
        await environmentApi.updateRoom(editingEnvironmentId, formData);
      } else {
        await environmentApi.createRoom(formData);
      }

      closeEnvironmentDialog();
      setError("");
      await loadEnvironments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Falha ao ${isEditMode ? "atualizar" : "criar"} ambiente`
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    openEnvironmentDialog,
    isEditMode,
    formData,
    setFormData,
    openCreateDialog,
    openEditDialog,
    closeEnvironmentDialog,
    handleSaveEnvironment,
  };
}
