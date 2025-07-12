// src/routes/PrivateRoute.jsx
import { useAuth } from "../contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Protects routes from unauthenticated access.
 * Usage: Wrap protected routes with <PrivateRoute />
 */
const PrivateRoute = () => {
  const { user } = useAuth();

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes/components
  return <Outlet />;
};

export default PrivateRoute;