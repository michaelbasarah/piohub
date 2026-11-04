import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const auth = { isAuthenticated: false };
const mutate = vi.fn();

vi.mock("./useAuth", () => ({ useAuth: () => auth }));
vi.mock("@/lib/trpc", () => ({
  trpc: { outreach: { attribute: { useMutation: () => ({ mutate }) } } },
}));

const { useOutreachCapture } = await import("./useOutreachCapture");

beforeEach(() => {
  localStorage.clear();
  mutate.mockReset();
  auth.isAuthenticated = false;
  window.history.replaceState({}, "", "/");
});

describe("useOutreachCapture", () => {
  test("remembers ?ref= and claims it once the visitor signs in", () => {
    window.history.replaceState({}, "", "/?ref=abc123");
    const { rerender } = renderHook(() => useOutreachCapture());
    expect(localStorage.getItem("piohub_ref")).toBe("abc123");
    expect(mutate).not.toHaveBeenCalled();

    auth.isAuthenticated = true;
    rerender();
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({ refCode: "abc123" });

    // the code is dropped after the attempt, whatever the outcome
    mutate.mock.calls[0][1].onSettled();
    expect(localStorage.getItem("piohub_ref")).toBeNull();

    rerender();
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  test("does nothing without a ref code", () => {
    auth.isAuthenticated = true;
    renderHook(() => useOutreachCapture());
    expect(mutate).not.toHaveBeenCalled();
  });
});
