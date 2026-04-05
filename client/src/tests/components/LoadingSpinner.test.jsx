import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LoadingSpinner from "../../components/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default text", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    render(<LoadingSpinner text="Loading users..." />);
    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });
});
