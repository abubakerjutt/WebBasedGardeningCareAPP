import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Alert } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({
  children,
  roles = [],
  requireAuth = true,
  showAccessDenied = true,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access
  if (roles.length > 0 && user) {
    if (!roles.includes(user?.role)) {
      if (showAccessDenied) {
        return (
          <Box p={3}>
            <Alert severity="error">
              Access denied. You don't have permission to view this page.
              <br />
              Your role: <strong>{user.role}</strong>
              <br />
              Required roles: <strong>{roles.join(", ")}</strong>
            </Alert>
          </Box>
        );
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
};

// Specific role-based route components for easier use
export const AdminRoute = ({ children, showAccessDenied = true }) => (
  <ProtectedRoute roles={["admin"]} showAccessDenied={showAccessDenied}>
    {children}
  </ProtectedRoute>
);

export const SupervisorRoute = ({ children, showAccessDenied = true }) => (
  <ProtectedRoute
    roles={["admin", "supervisor", "gardener"]}
    showAccessDenied={showAccessDenied}
  >
    {children}
  </ProtectedRoute>
);

export const HomeownerRoute = ({ children, showAccessDenied = true }) => (
  <ProtectedRoute
    roles={["admin", "supervisor", "gardener", "homeowner"]}
    showAccessDenied={showAccessDenied}
  >
    {children}
  </ProtectedRoute>
);

export const GardenerRoute = ({ children, showAccessDenied = true }) => (
  <ProtectedRoute
    roles={["admin", "supervisor", "homeowner", "gardener"]}
    showAccessDenied={showAccessDenied}
  >
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
