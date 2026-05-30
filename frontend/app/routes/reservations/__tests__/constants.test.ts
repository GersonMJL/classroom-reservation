import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import { toIdOrEmpty, dateOrInvalid } from "../constants";

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
