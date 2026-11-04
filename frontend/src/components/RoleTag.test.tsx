import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import RoleTag from "./RoleTag";

afterEach(cleanup);

describe("RoleTag", () => {
  test("known roles get their colour, case-insensitively", () => {
    render(<RoleTag role="UI/UX" />);
    expect(screen.getByText("UI/UX").className).toContain("bg-pink-50");
  });

  test("unknown roles fall back to the neutral style", () => {
    render(<RoleTag role="Campus Ambassador" />);
    const tag = screen.getByText("Campus Ambassador");
    expect(tag.className).toContain("bg-secondary");
    expect(tag.className).not.toMatch(/bg-(blue|pink|violet)-50/);
  });

  test("size and extra classes", () => {
    render(<RoleTag role="ML" size="md" className="extra" />);
    const tag = screen.getByText("ML");
    expect(tag.className).toContain("text-sm");
    expect(tag.className).toContain("extra");
  });
});
