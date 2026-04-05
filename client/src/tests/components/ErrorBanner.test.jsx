import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ErrorBanner from "../../components/ErrorBanner";

describe("ErrorBanner", () => {
  it("renders the error message", () => {
    render(<ErrorBanner error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders nothing when error is falsy", () => {
    const { container } = render(<ErrorBanner error="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when error is null", () => {
    const { container } = render(<ErrorBanner error={null} />);
    expect(container.firstChild).toBeNull();
  });
});
