import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import {
  toIdOrEmpty,
  dateOrInvalid,
  RESERVATION_PURPOSE_OPTIONS,
  formatPurpose,
  toPurposeValue,
} from "../constants";

describe("toIdOrEmpty", () => {
  it("returns the number for a valid positive id (string or number)", () => {
    expect(toIdOrEmpty("5")).toBe(5);
    expect(toIdOrEmpty(3)).toBe(3);
  });

  it('returns "" for empty, zero, or non-numeric input', () => {
    expect(toIdOrEmpty("")).toBe("");
    expect(toIdOrEmpty(0)).toBe("");
    expect(toIdOrEmpty("abc")).toBe("");
    expect(toIdOrEmpty(null)).toBe("");
    expect(toIdOrEmpty(undefined)).toBe("");
  });
});

describe("dateOrInvalid", () => {
  it("passes a valid Dayjs through unchanged", () => {
    const d = dayjs("2026-05-30T09:00:00");
    expect(dateOrInvalid(d)).toBe(d);
  });

  it("maps null to an invalid Dayjs", () => {
    expect(dateOrInvalid(null).isValid()).toBe(false);
  });

  it("passes an already-invalid Dayjs through unchanged (mid-typing case)", () => {
    expect(dateOrInvalid(dayjs("not-a-date")).isValid()).toBe(false);
  });
});

describe("RESERVATION_PURPOSE_OPTIONS", () => {
  it("lists the six canonical purposes with pt-BR labels", () => {
    expect(RESERVATION_PURPOSE_OPTIONS).toEqual([
      { value: "CLASS", label: "Aula" },
      { value: "MEETING", label: "Reunião" },
      { value: "RESEARCH", label: "Pesquisa" },
      { value: "EVENT", label: "Evento" },
      { value: "MAINTENANCE", label: "Manutenção" },
      { value: "TRAINING", label: "Treinamento" },
    ]);
  });
});

describe("formatPurpose", () => {
  it("maps a known enum value to its pt-BR label", () => {
    expect(formatPurpose("CLASS")).toBe("Aula");
    expect(formatPurpose("TRAINING")).toBe("Treinamento");
  });

  it("returns the raw string for legacy/unknown values", () => {
    expect(formatPurpose("Aula de Banco de Dados")).toBe(
      "Aula de Banco de Dados"
    );
    expect(formatPurpose("")).toBe("");
  });
});

describe("toPurposeValue", () => {
  it("returns the value when it is a known enum value", () => {
    expect(toPurposeValue("MEETING")).toBe("MEETING");
  });

  it("returns empty string for legacy/unknown values", () => {
    expect(toPurposeValue("Aula de Banco de Dados")).toBe("");
    expect(toPurposeValue("")).toBe("");
  });
});
