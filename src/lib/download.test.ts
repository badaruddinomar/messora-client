import { describe, expect, it } from "vitest";
import { fileNameFrom } from "./download";

describe("fileNameFrom", () => {
  it("reads the attachment's file name, or falls back", () => {
    expect(fileNameFrom('attachment; filename="mess-2026-10-summary.csv"', "x.csv")).toBe(
      "mess-2026-10-summary.csv",
    );
    expect(fileNameFrom(null, "x.csv")).toBe("x.csv");
  });
});
