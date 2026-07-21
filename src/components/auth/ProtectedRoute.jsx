import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const role = localStorage.getItem("vtks_user_role");

  if (role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}