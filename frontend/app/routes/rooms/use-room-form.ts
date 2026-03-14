import { useState } from "react";
import {
  purposeApi,
  roomApi,
} from "../../services/api";
import type {
  Purpose,
  Resource,
  Room,
  RoomCreate,
  RoomResourceAssignment,
} from "../../services/api";
import type { TypeAttributeField } from "./types";

const initialFormData: RoomCreate = {
  room_id: "",
  room_type: "classroom",
  location: "",
  capacity: 0,
  accessibility: false,
  allowed_purposes: [],
  criticality: "common",
  type_attributes: {},
  fixed_resources: [],
  optional_resources: [],
};

type UseRoomFormArgs = {
  resources: Resource[];
  purposes: Purpose[];
  setPurposes: React.Dispatch<React.SetStateAction<Purpose[]>>;
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  loadRooms: (page?: number) => Promise<void>;
};

export function useRoomForm({
  resources,
  purposes,
  setPurposes,
  setLoading,
  setError,
  loadRooms,
}: UseRoomFormArgs) {
  const [openRoomDialog, setOpenRoomDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomCreate>(initialFormData);
  const [purposeInput, setPurposeInput] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [fixedResourceId, setFixedResourceId] = useState<number | "">("");
  const [optionalResourceId, setOptionalResourceId] = useState<number | "">("");
  const [fixedResourceQty, setFixedResourceQty] = useState(1);
  const [optionalResourceQty, setOptionalResourceQty] = useState(1);
  const [typeAttributeFields, setTypeAttributeFields] = useState<TypeAttributeField[]>([]);

  const resetForm = () => {
    setFormData(initialFormData);
    setPurposeInput("");
    setSelectedPurpose("");
    setFixedResourceId("");
    setOptionalResourceId("");
    setFixedResourceQty(1);
    setOptionalResourceQty(1);
    setTypeAttributeFields([]);
    setIsEditMode(false);
    setEditingRoomId(null);
  };

  const stringifyAttributeValue = (value: unknown): string => {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  };

  const inferAttributeValueType = (
    value: unknown
  ): TypeAttributeField["valueType"] => {
    if (typeof value === "boolean") {
      return "boolean";
    }
    if (typeof value === "number") {
      return "number";
    }
    return "text";
  };

  const attributesToFields = (attributes: Record<string, unknown>) =>
    Object.entries(attributes).map(([key, value]) => ({
      key,
      valueType: inferAttributeValueType(value),
      value: stringifyAttributeValue(value),
    }));

  const openCreateDialog = () => {
    resetForm();
    setOpenRoomDialog(true);
  };

  const openEditDialog = (room: Room) => {
    setIsEditMode(true);
    setEditingRoomId(room.id);
    setFormData({
      room_id: room.room_id,
      room_type: room.room_type,
      location: room.location,
      capacity: room.capacity,
      accessibility: room.accessibility,
      allowed_purposes: room.allowed_purposes,
      criticality: room.criticality,
      supervisor_user_id: room.supervisor_user_id,
      type_attributes: room.type_attributes || {},
      fixed_resources: room.fixed_resources.map((item) => ({
        resource_id: item.resource_id,
        quantity: item.quantity,
      })),
      optional_resources: room.optional_resources.map((item) => ({
        resource_id: item.resource_id,
        quantity: item.quantity,
      })),
    });
    setTypeAttributeFields(attributesToFields(room.type_attributes || {}));
    setOpenRoomDialog(true);
  };

  const closeRoomDialog = () => {
    setOpenRoomDialog(false);
    resetForm();
  };

  const buildTypeAttributes = (): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const item of typeAttributeFields) {
      const key = item.key.trim();
      if (!key) {
        continue;
      }
      if (item.valueType === "boolean") {
        result[key] = item.value === "true";
        continue;
      }
      if (item.valueType === "number") {
        const numberValue = Number(item.value);
        if (item.value.trim() === "" || Number.isNaN(numberValue)) {
          setError(`O atributo '${key}' deve ter um valor numérico válido`);
          throw new Error("Valor numérico inválido");
        }
        result[key] = numberValue;
        continue;
      }
      result[key] = item.value;
    }
    return result;
  };

  const addTypeAttributeField = () => {
    setTypeAttributeFields((prev) => [
      ...prev,
      { key: "", valueType: "text", value: "" },
    ]);
  };

  const updateTypeAttributeField = (
    index: number,
    field: keyof TypeAttributeField,
    value: string
  ) => {
    setTypeAttributeFields((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeTypeAttributeField = (index: number) => {
    setTypeAttributeFields((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const upsertResourceAssignment = (
    key: "fixed_resources" | "optional_resources",
    assignment: RoomResourceAssignment
  ) => {
    setFormData((prev) => {
      const current = prev[key];
      const existingIndex = current.findIndex(
        (item) => item.resource_id === assignment.resource_id
      );
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = assignment;
        return { ...prev, [key]: updated };
      }
      return { ...prev, [key]: [...current, assignment] };
    });
  };

  const removeResourceAssignment = (
    key: "fixed_resources" | "optional_resources",
    resourceId: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item.resource_id !== resourceId),
    }));
  };

  const getResourceLabel = (resourceId: number) => {
    const resource = resources.find((item) => item.id === resourceId);
    return resource ? `${resource.resource_code} - ${resource.name}` : `#${resourceId}`;
  };

  const handleSaveRoom = async () => {
    if (!formData.room_id.trim()) {
      setError("ID do ambiente é obrigatório");
      return;
    }
    if (!formData.room_type.trim()) {
      setError("Tipo de ambiente é obrigatório");
      return;
    }
    if (!formData.location.trim()) {
      setError("Localização é obrigatória");
      return;
    }
    if (formData.capacity <= 0) {
      setError("Capacidade deve ser maior que 0");
      return;
    }
    if (formData.allowed_purposes.length === 0) {
      setError("Pelo menos uma finalidade permitida é obrigatória");
      return;
    }
    if (formData.room_type === "laboratory") {
      setError("Ambientes de laboratório estão temporariamente desativados nesta interface");
      return;
    }

    setLoading(true);
    try {
      const payload: RoomCreate = {
        ...formData,
        type_attributes: buildTypeAttributes(),
      };

      if (isEditMode && editingRoomId !== null) {
        await roomApi.updateRoom(editingRoomId, payload);
      } else {
        await roomApi.createRoom(payload);
      }

      closeRoomDialog();
      setError("");
      await loadRooms();
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

  const handleAddPurpose = () => {
    const value = selectedPurpose.trim();
    if (value && !formData.allowed_purposes.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        allowed_purposes: [...prev.allowed_purposes, value],
      }));
      setSelectedPurpose("");
    }
  };

  const handleCreatePurpose = async () => {
    const normalized = purposeInput.trim();
    if (!normalized) {
      setError("O nome da finalidade não pode estar vazio");
      return;
    }

    try {
      const created = await purposeApi.createPurpose({ name: normalized });
      setPurposes((prev) => {
        if (prev.some((item) => item.id === created.id)) {
          return prev;
        }
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      if (!formData.allowed_purposes.includes(created.name)) {
        setFormData((prev) => ({
          ...prev,
          allowed_purposes: [...prev.allowed_purposes, created.name],
        }));
      }
      setPurposeInput("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar finalidade");
    }
  };

  const handleRemovePurpose = (purpose: string) => {
    setFormData((prev) => ({
      ...prev,
      allowed_purposes: prev.allowed_purposes.filter((p) => p !== purpose),
    }));
  };

  const addFixedResource = () => {
    if (!fixedResourceId || fixedResourceQty < 1) {
      return;
    }
    upsertResourceAssignment("fixed_resources", {
      resource_id: fixedResourceId,
      quantity: fixedResourceQty,
    });
    setFixedResourceId("");
    setFixedResourceQty(1);
  };

  const addOptionalResource = () => {
    if (!optionalResourceId || optionalResourceQty < 1) {
      return;
    }
    upsertResourceAssignment("optional_resources", {
      resource_id: optionalResourceId,
      quantity: optionalResourceQty,
    });
    setOptionalResourceId("");
    setOptionalResourceQty(1);
  };

  return {
    openRoomDialog,
    isEditMode,
    formData,
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
    openCreateDialog,
    openEditDialog,
    closeRoomDialog,
    handleSaveRoom,
    handleAddPurpose,
    handleCreatePurpose,
    handleRemovePurpose,
    addFixedResource,
    addOptionalResource,
    addTypeAttributeField,
    updateTypeAttributeField,
    removeTypeAttributeField,
    removeResourceAssignment,
    getResourceLabel,
  };
}
