import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";

/**
 * Render a component wrapped in MemoryRouter + AuthProvider.
 * Pass initialAuth: { user, token } to simulate a logged-in state.
 */
export function renderWithProviders(ui, { route = "/", initialAuth = null } = {}) {
  if (initialAuth) {
    localStorage.setItem("user", JSON.stringify(initialAuth.user));
    localStorage.setItem("token", initialAuth.token);
  }
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}
