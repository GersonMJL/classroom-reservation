import { useEffect, useState } from "react";
import { environmentApi, locationApi } from "../../services/api";
import type { Environment, EnvironmentCreate, Location } from "../../services/api";
import { useToast } from "../../ui/useToast";

const initialFormData: EnvironmentCreate = {
  name: "",
  type: "CLASSROOM",
  criticality: "COMMON",
  capacity: 1,
  location_id: 0,
  operating_hours: "08:00-18:00",
  requires_approval: false,
};

type UseEnvironmentFormArgs = {
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  loadEnvironments: (page?: number) => Promise<void>;
};

export function useEnvironmentForm({ setLoading, setError, loadEnvironments }: UseEnvironmentFormArgs) {
  const toast = useToast();
  const [openEnvironmentDialog, setOpenEnvironmentDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEnvironmentId, setEditingEnvironmentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EnvironmentCreate>(initialFormData);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const loadLocations = async () => {
    setLoadingLocations(true);
    try {
      const data = await locationApi.getAllLocations(0, 500);
      setLocations(data);
      if (data.length > 0) {
        setFormData((prev) => (
          prev.location_id > 0 ? prev : { ...prev, location_id: data[0].id }
        ));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao carregar localizações";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    void loadLocations();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditMode(false);
    setEditingEnvironmentId(null);
  };

  const openCreateDialog = () => {
    void loadLocations();
    setFormData({
      ...initialFormData,
      location_id: locations[0]?.id ?? 0,
    });
    setIsEditMode(false);
    setEditingEnvironmentId(null);
    setOpenEnvironmentDialog(true);
  };

  const openEditDialog = (environment: Environment) => {
    void loadLocations();
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
      const msg = "Nome do ambiente é obrigatório";
      toast.error(msg);
      setError(msg);
      return;
    }
    if (!formData.type.trim()) {
      const msg = "Tipo de ambiente é obrigatório";
      toast.error(msg);
      setError(msg);
      return;
    }
    if (formData.location_id <= 0) {
      const msg = "Selecione uma localização válida";
      toast.error(msg);
      setError(msg);
      return;
    }
    if (formData.capacity <= 0) {
      const msg = "Capacidade deve ser maior que 0";
      toast.error(msg);
      setError(msg);
      return;
    }
    if (!formData.operating_hours.trim()) {
      const msg = "Horário de funcionamento é obrigatório";
      toast.error(msg);
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && editingEnvironmentId !== null) {
        await environmentApi.updateRoom(editingEnvironmentId, formData);
        toast.success("Ambiente atualizado.");
      } else {
        await environmentApi.createRoom(formData);
        toast.success("Ambiente salvo.");
      }

      closeEnvironmentDialog();
      setError("");
      await loadEnvironments();
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : `Falha ao ${isEditMode ? "atualizar" : "criar"} ambiente`;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    openEnvironmentDialog,
    isEditMode,
    formData,
    locations,
    loadingLocations,
    setFormData,
    openCreateDialog,
    openEditDialog,
    closeEnvironmentDialog,
    handleSaveEnvironment,
  };
}
