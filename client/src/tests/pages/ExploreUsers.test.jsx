import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import ExploreUsers from "../../pages/ExploreUsers";
import { renderWithProviders } from "../utils";

describe("ExploreUsers page", () => {
  it("renders the page heading", async () => {
    renderWithProviders(<ExploreUsers />);
    expect(screen.getByText("Find Skill Partners")).toBeInTheDocument();
  });

  it("renders the search input", () => {
    renderWithProviders(<ExploreUsers />);
    expect(
      screen.getByPlaceholderText(/react, guitar, spanish/i)
    ).toBeInTheDocument();
  });

  it("renders the Search button", () => {
    renderWithProviders(<ExploreUsers />);
    expect(screen.getByRole("button", { name: /^search$/i })).toBeInTheDocument();
  });

  it("shows user cards after loading", async () => {
    renderWithProviders(<ExploreUsers />);
    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });
  });

  it("shows community member count after loading", async () => {
    renderWithProviders(<ExploreUsers />);
    await waitFor(() => {
      expect(screen.getByText(/member/i)).toBeInTheDocument();
    });
  });

  it("shows 'Login to View Profile' for unauthenticated users", async () => {
    renderWithProviders(<ExploreUsers />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /login to view profile/i })
      ).toBeInTheDocument();
    });
  });

  it("shows 'View Profile' link for authenticated users", async () => {
    renderWithProviders(<ExploreUsers />, {
      initialAuth: { user: { id: "me", name: "Me" }, token: "tok123" },
    });
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /view profile/i })).toBeInTheDocument();
    });
  });

  it("shows search results after submitting a search", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExploreUsers />);
    // Wait for initial load
    await waitFor(() => screen.getByText("Alice Smith"));

    const input = screen.getByPlaceholderText(/react, guitar, spanish/i);
    await user.type(input, "javascript");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(screen.getByText(/found for/i)).toBeInTheDocument();
    });
  });

  it("shows Clear button when search is active", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExploreUsers />);
    await waitFor(() => screen.getByText("Alice Smith"));

    const input = screen.getByPlaceholderText(/react, guitar, spanish/i);
    await user.type(input, "react");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    });
  });

  it("clears search results when Clear is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExploreUsers />);
    await waitFor(() => screen.getByText("Alice Smith"));

    const input = screen.getByPlaceholderText(/react, guitar, spanish/i);
    await user.type(input, "react");
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    await waitFor(() => screen.getByRole("button", { name: /clear/i }));

    await user.click(screen.getByRole("button", { name: /clear/i }));
    await waitFor(() => {
      expect(screen.queryByText(/found for/i)).not.toBeInTheDocument();
    });
  });
});
