import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import ProjectForm from "./ProjectForm";

afterEach(cleanup);

function setup(onSubmit = vi.fn()) {
  render(
    <ProjectForm
      onSubmit={onSubmit}
      isPending={false}
      submitLabel="Post Project"
      pendingLabel="Posting..."
      cancelHref="/projects"
    />
  );
  return onSubmit;
}

const submit = () => fireEvent.click(screen.getByRole("button", { name: /post project/i }));

describe("ProjectForm", () => {
  test("blocks an empty submit and explains why", () => {
    const onSubmit = setup();
    submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Title must be at least 3 characters")).toBeTruthy();
    expect(screen.getByText("Add at least one needed role")).toBeTruthy();
  });

  test("submits trimmed values with roles from typing and suggestions", () => {
    const onSubmit = setup();
    fireEvent.change(screen.getByLabelText(/project title/i), {
      target: { value: "  Study-group finder  " },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Match classmates into study groups." },
    });
    const roleInput = screen.getByPlaceholderText(/type a role/i);
    fireEvent.change(roleInput, { target: { value: "Backend" } });
    fireEvent.keyDown(roleInput, { key: "Enter" });
    // the suggestion for a role already added disappears (case-insensitive)
    expect(screen.queryByRole("button", { name: "+ Backend" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "+ Designer" }));
    fireEvent.change(screen.getByLabelText(/team size/i), { target: { value: "4" } });

    submit();
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Study-group finder",
      description: "Match classmates into study groups.",
      neededRoles: ["Backend", "Designer"],
      maxTeamSize: 4,
    });
  });

  test("team size can be cleared while typing but not submitted empty", () => {
    const onSubmit = setup();
    const size = screen.getByLabelText(/team size/i) as HTMLInputElement;
    fireEvent.change(size, { target: { value: "" } });
    expect(size.value).toBe("");
    submit();
    expect(screen.getByText("Team size must be between 2 and 20")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
