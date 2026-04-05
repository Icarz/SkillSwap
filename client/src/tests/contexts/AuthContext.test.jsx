import { render, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";

const mockUser = { id: "u1", name: "Alice", email: "alice@test.com" };
const mockToken = "tok-abc123";

// Test component that captures context value on each render
const Capture = ({ onRender }) => {
  const auth = useAuth();
  onRender(auth);
  return null;
};

const renderAuth = (onRender) =>
  render(
    <AuthProvider>
      <Capture onRender={onRender} />
    </AuthProvider>
  );

describe("AuthContext", () => {
  beforeEach(() => localStorage.clear());

  it("provides null user and token by default", () => {
    let auth;
    renderAuth((a) => (auth = a));
    expect(auth.user).toBeNull();
    expect(auth.token).toBeNull();
  });

  it("restores user and token from localStorage on mount", () => {
    localStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("token", mockToken);
    let auth;
    renderAuth((a) => (auth = a));
    expect(auth.user).toEqual(mockUser);
    expect(auth.token).toBe(mockToken);
  });

  it("login() sets user, token, and persists to localStorage", () => {
    let auth;
    renderAuth((a) => (auth = a));
    act(() => auth.login(mockUser, mockToken));
    expect(auth.user).toEqual(mockUser);
    expect(auth.token).toBe(mockToken);
    expect(JSON.parse(localStorage.getItem("user"))).toEqual(mockUser);
    expect(localStorage.getItem("token")).toBe(mockToken);
  });

  it("logout() clears user, token, and localStorage", () => {
    localStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("token", mockToken);
    let auth;
    renderAuth((a) => (auth = a));
    act(() => auth.logout());
    expect(auth.user).toBeNull();
    expect(auth.token).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("updateUser() updates user without clearing token", () => {
    localStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("token", mockToken);
    let auth;
    renderAuth((a) => (auth = a));
    const updated = { ...mockUser, name: "Alice Updated" };
    act(() => auth.updateUser(updated));
    expect(auth.user).toEqual(updated);
    expect(auth.token).toBe(mockToken);
    expect(JSON.parse(localStorage.getItem("user"))).toEqual(updated);
  });
});
