import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MoneyText } from "./money-text";
import { StatusBadge } from "./status-badge";

describe("MoneyText", () => {
  it("shows plain amounts", () => {
    render(<MoneyText value="1250.5" />);
    expect(screen.getByText("৳1,250.50")).toBeInTheDocument();
  });

  it("reads a negative balance as a due, in the destructive colour", () => {
    render(<MoneyText value="-500" variant="balance" />);
    const el = screen.getByText("Due ৳500.00");
    expect(el).toHaveClass("text-destructive");
  });

  it("reads a positive balance as a refund", () => {
    render(<MoneyText value="120" variant="balance" />);
    expect(screen.getByText("Refund ৳120.00")).toHaveClass("text-success");
  });

  it("reads a zero balance as settled", () => {
    render(<MoneyText value="0.00" variant="balance" />);
    expect(screen.getByText("Settled")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("labels statuses with text, not colour alone", () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
