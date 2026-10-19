import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResendCodeButton } from "./resend-code-button";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

describe("ResendCodeButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down before allowing a resend, then restarts the countdown", async () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    render(<ResendCodeButton onResend={onResend} initialCooldown={3} />);

    expect(screen.getByRole("button", { name: "Resend in 3s" })).toBeDisabled();
    for (let i = 0; i < 3; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    const button = screen.getByRole("button", { name: "Resend code" });
    expect(button).toBeEnabled();

    await act(async () => {
      fireEvent.click(button);
    });
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Resend in 60s" })).toBeDisabled();
  });

  it("stays available after a failed resend", async () => {
    const onResend = vi.fn().mockRejectedValue(new Error("nope"));
    render(<ResendCodeButton onResend={onResend} initialCooldown={0} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    });
    expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
  });
});
