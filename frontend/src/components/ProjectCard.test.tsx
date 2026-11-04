import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import ProjectCard from "./ProjectCard";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const base = {
  id: 7,
  title: "Campus bike-share map",
  description: "A live map of free bikes around campus.",
  neededRoles: ["Frontend", "Backend"],
  memberCount: 2,
  maxTeamSize: 5,
};

describe("ProjectCard", () => {
  test("links to the project and shows the team size", () => {
    render(<ProjectCard {...base} ownerName="Sam" />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/projects/7");
    expect(screen.getByText("by Sam")).toBeTruthy();
    expect(screen.getByText("2 / 5 members")).toBeTruthy();
  });

  test("shows at most four roles, then a +N more", () => {
    const roles = ["Frontend", "Backend", "Designer", "ML", "DevOps", "Mobile"];
    render(<ProjectCard {...base} neededRoles={roles} />);
    expect(screen.getByText("ML")).toBeTruthy();
    expect(screen.queryByText("DevOps")).toBeNull();
    expect(screen.getByText("+2 more")).toBeTruthy();
  });

  test("posted time reads as relative", () => {
    vi.useFakeTimers({ now: new Date("2026-06-20T12:00:00Z") });
    const { rerender } = render(
      <ProjectCard {...base} createdAt={new Date("2026-06-20T09:00:00Z")} />
    );
    expect(screen.getByText("posted 3h ago")).toBeTruthy();
    rerender(<ProjectCard {...base} createdAt={new Date("2026-06-18T12:00:00Z")} />);
    expect(screen.getByText("posted 2d ago")).toBeTruthy();
    rerender(<ProjectCard {...base} createdAt={new Date("2026-06-20T11:59:40Z")} />);
    expect(screen.getByText("posted just now")).toBeTruthy();
  });
});
