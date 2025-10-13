import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleName = typeof user.role === "object" ? user.role.name : user.role;

  if (requiredRole && roleName !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
