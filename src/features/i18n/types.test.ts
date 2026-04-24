import { describe, expect, it } from "vitest";
import { isLocale } from "@/features/i18n/types";

describe("isLocale", () => {
  it("accepts supported locales", () => {
    expect(isLocale("pt-BR")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it("rejects unsupported locales", () => {
    expect(isLocale("es")).toBe(false);
  });
});
