import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import UserCard from "../../components/UserCard";
import { renderWithProviders } from "../utils";

const mockUser = {
  _id: "user-1",
  name: "Alice Smith",
  bio: "I love coding",
  email: "alice@example.com",
  avatar: "",
  skills: [
    { _id: "s1", name: "javascript", category: { icon: "💻", name: "programming" } },
    { _id: "s2", name: "react", category: { icon: "💻", name: "programming" } },
  ],
  learning: [
    { _id: "s3", name: "python", category: { icon: "🐍", name: "programming" } },
  ],
  avgRating: 4.5,
  reviewCount: 3,
  transactionCount: 2,
  createdAt: "2024-01-01T00:00:00Z",
};

describe("UserCard", () => {
  it("renders user name", () => {
    renderWithProviders(<UserCard user={mockUser} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("renders user bio", () => {
    renderWithProviders(<UserCard user={mockUser} />);
    expect(screen.getByText("I love coding")).toBeInTheDocument();
  });

  it("renders skills in Teaches section", () => {
    renderWithProviders(<UserCard user={mockUser} />);
    expect(screen.getByText("javascript")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
  });

  it("renders learning goals in Wants to Learn section", () => {
    renderWithProviders(<UserCard user={mockUser} />);
    expect(screen.getByText("python")).toBeInTheDocument();
  });

  it("shows swap count", () => {
    renderWithProviders(<UserCard user={mockUser} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows average rating when provided", () => {
    renderWithProviders(<UserCard user={mockUser} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("shows 'No reviews yet' when avgRating is null", () => {
    renderWithProviders(<UserCard user={{ ...mockUser, avgRating: null }} />);
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
  });

  it("shows 'Login to View Profile' button when not authenticated", () => {
    renderWithProviders(<UserCard user={mockUser} />);
    expect(screen.getByRole("button", { name: /login to view profile/i })).toBeInTheDocument();
  });

  it("shows 'View Profile' link when authenticated", () => {
    renderWithProviders(<UserCard user={mockUser} />, {
      initialAuth: { user: { id: "me", name: "Me" }, token: "tok123" },
    });
    expect(screen.getByRole("link", { name: /view profile/i })).toBeInTheDocument();
  });

  it("'View Profile' link points to correct profile URL", () => {
    renderWithProviders(<UserCard user={mockUser} />, {
      initialAuth: { user: { id: "me", name: "Me" }, token: "tok123" },
    });
    expect(screen.getByRole("link", { name: /view profile/i })).toHaveAttribute(
      "href",
      "/profile/user-1"
    );
  });

  it("clicking 'Login to View Profile' does not crash", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserCard user={mockUser} />);
    // Should not throw
    await user.click(screen.getByRole("button", { name: /login to view profile/i }));
  });

  it("shows 'None listed' when user has no skills", () => {
    renderWithProviders(<UserCard user={{ ...mockUser, skills: [] }} />);
    expect(screen.getAllByText("None listed").length).toBeGreaterThan(0);
  });

  it("shows initials when no avatar", () => {
    renderWithProviders(<UserCard user={mockUser} />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });
});
