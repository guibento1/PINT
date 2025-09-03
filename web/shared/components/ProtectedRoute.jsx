import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const rawRoles = Array.isArray(user?.roles) ? user.roles : [];
  const roles = rawRoles
    .map((r) => (typeof r === "string" ? r : r?.role || r?.nome || r))
    .filter(Boolean)
    .map((r) => String(r).toLowerCase());
  const allowed = Array.isArray(allowedRoles)
    ? roles.some((r) =>
        allowedRoles.map((x) => String(x).toLowerCase()).includes(r)
      )
    : false;

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!allowed) {
    return <Navigate to="/nao-autorizado" replace />;
  }

  return children;
}
