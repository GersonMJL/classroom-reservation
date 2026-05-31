import type { ChipProps } from "@mui/material";
import type { EnvironmentCriticality } from "../../services/api";

// Rótulos pt-BR para a criticidade do ambiente (principal critério de decisão do UC04).
export const CRITICALITY_LABEL: Record<EnvironmentCriticality, string> = {
  COMMON: "Comum",
  CONTROLLED: "Controlado",
  RESTRICTED: "Restrito",
};

// Cor do Chip por nível, em severidade crescente.
export const CRITICALITY_COLOR: Record<EnvironmentCriticality, ChipProps["color"]> = {
  COMMON: "success",
  CONTROLLED: "warning",
  RESTRICTED: "error",
};

// Rank de ordenação: quanto menor, mais crítico — aparece primeiro na fila de aprovação.
export const CRITICALITY_RANK: Record<EnvironmentCriticality, number> = {
  RESTRICTED: 0,
  CONTROLLED: 1,
  COMMON: 2,
};

// Rótulo pt-BR de uma criticidade; faz fallback para o valor cru em linhas legadas/desconhecidas.
export const formatCriticality = (criticality: string): string =>
  CRITICALITY_LABEL[criticality as EnvironmentCriticality] ?? criticality;
