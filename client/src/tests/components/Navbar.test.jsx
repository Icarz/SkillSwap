import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Navbar from "../../components/Navbar";
import { renderWithProviders } from "../utils";

// Mock useSocket — Navbar calls it but tests don't need a real socket
vi.mock("../../hooks/useSocket", () => ({
  useSocket: () => ({ socket: null, isConnected: false, isReconnecting: false }),
}));

describe("Navbar", () => {
  it("renders the SkillSwap brand name", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("SkillSwap")).toBeInTheDocument();
  });

  it("shows 'Explore Skills' and 'Explore Users' links always", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getAllByText("Explore Skills").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Explore Users").length).toBeGreaterThan(0);
  });

  it("shows Login and Register links when not authenticated", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getAllByText("Login").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Register").length).toBeGreaterThan(0);
  });

  it("hides Login/Register and shows Dashboard when authenticated", () => {
    renderWithProviders(<Navbar />, {
      initialAuth: { user: { id: "1", name: "Alice Smith" }, token: "tok" },
    });
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
  });

  it("shows user initials in avatar when authenticated", () => {
    renderWithProviders(<Navbar />, {
      initialAuth: { user: { id: "1", name: "Alice Smith" }, token: "tok" },
    });
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("shows single initial for single-name user", () => {
    renderWithProviders(<Navbar />, {
      initialAuth: { user: { id: "1", name: "Alice" }, token: "tok" },
    });
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
