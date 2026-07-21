import { Navigate } from "react-router-dom";

export default function SubscriberRoute({ children }) {
  const role = String(
    localStorage.getItem("vtks_user_role") || ""
  )
    .trim()
    .toLowerCase();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "subscriber" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}